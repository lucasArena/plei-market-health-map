import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, screen } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { UserMenu } from "@/presentation/components/layout/UserMenu/UserMenuComponent";

vi.mock("@/infrastructure/auth/actions", () => ({ signOutOfApp: vi.fn() }));

const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

function renderMenu(name: string | null = "Lucas Arena", isAdmin = true) {
	const { Wrapper } = createQueryWrapper();
	return renderWithMessages(
		<Wrapper>
			<UserMenu name={name} email="lucas@plei.com" image={null} isAdmin={isAdmin} />
		</Wrapper>,
	);
}

function finishClosing() {
	fireEvent(screen.getByRole("dialog"), new Event("webkitAnimationEnd", { bubbles: true }));
}

describe("UserMenu", () => {
	it("pins a 40px account control with the session scale slot 8px above it", () => {
		renderMenu();

		expect(globalsCss).toContain("--map-profile-bottom: var(--map-frame);");
		expect(globalsCss).toContain("--map-profile-size: 40px;");
		expect(globalsCss).toContain("--map-profile-legend-gap: 8px;");

		const trigger = screen.getByRole("button", { name: "Account menu" });
		expect(trigger).toHaveClass(
			"map-glass",
			"size-[var(--map-profile-size)]",
			"rounded-full",
			"shadow-[var(--map-shadow)]",
		);
		expect(screen.getByText("LA")).toHaveClass("size-[32px]", "bg-[#d1d5db]", "text-[#111827]");
		const stack = trigger.parentElement;
		const legendSlot = screen.getByTestId("profile-legend-slot");
		expect(stack).toHaveClass(
			"fixed",
			"bottom-[var(--map-profile-bottom)]",
			"left-[var(--map-frame)]",
			"flex-col",
			"gap-[var(--map-profile-legend-gap)]",
		);
		expect(legendSlot.nextElementSibling).toBe(trigger);
		expect(screen.queryByRole("button", { name: "Send feedback" })).not.toBeInTheDocument();
	});

	it("opens a flat account menu with feedback types above the scale slot", () => {
		renderMenu();
		fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

		const dialog = screen.getByRole("dialog", { name: "Account menu" });
		expect(dialog).toHaveClass(
			"bottom-full",
			"left-0",
			"mb-[var(--map-profile-legend-gap)]",
			"map-glass",
			"shadow-[var(--map-shadow)]",
		);
		expect(dialog).toHaveTextContent("Lucas Arena");
		expect(dialog).toHaveTextContent("lucas@plei.com");
		expect(screen.getByRole("button", { name: /Suggest an improvement/ })).toHaveClass(
			"rounded-sm",
			"focus:bg-accent",
			"px-2",
			"py-1.5",
		);
		expect(screen.getByRole("link", { name: "App metrics" })).toHaveAttribute("href", "/metrics");
		expect(screen.getByRole("link", { name: "Feature flags" })).toHaveAttribute(
			"href",
			"/feature-flags",
		);
		expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
		expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Send feedback" })).not.toBeInTheDocument();
	});

	it("hides the admin links from non-admins", () => {
		renderMenu("Lucas Arena", false);
		fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
		expect(screen.queryByRole("link", { name: "App metrics" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Feature flags" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
	});

	it("falls back to the email when there is no name", () => {
		renderMenu(null);
		fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
		expect(screen.getAllByText("lucas@plei.com").length).toBeGreaterThan(1);
	});

	it("closes on Escape and on an outside click, but not on an inside click", () => {
		renderMenu("Lucas");
		const trigger = screen.getByRole("button", { name: "Account menu" });

		fireEvent.click(trigger);
		fireEvent.keyDown(window, { key: "Enter" });
		expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
		fireEvent.keyDown(window, { key: "Escape" });
		expect(screen.getByRole("dialog")).toHaveClass("feedback-pop-out");
		finishClosing();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		fireEvent.click(trigger);
		fireEvent.mouseDown(screen.getByRole("dialog"));
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		fireEvent.mouseDown(document.body);
		finishClosing();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
