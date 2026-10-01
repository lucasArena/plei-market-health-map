import { fireEvent, screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { UserMenu } from "@/presentation/components/layout/UserMenu/UserMenuComponent";

vi.mock("@/infrastructure/auth/actions", () => ({ signOutOfApp: vi.fn() }));

describe("UserMenu", () => {
	afterEach(() => vi.unstubAllEnvs());

	it("opens to show the account and a sign-out action", () => {
		renderWithMessages(<UserMenu name="Lucas Arena" email="lucas@plei.com" image={null} isAdmin />);

		const trigger = screen.getByRole("button", { name: "Account menu" });
		expect(screen.getByText("LA")).toBeInTheDocument();
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();

		fireEvent.click(trigger);

		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByRole("menu")).toHaveTextContent("Lucas Arena");
		expect(screen.getByText("lucas@plei.com")).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
		const metrics = screen.getByRole("menuitem", { name: "App metrics" });
		expect(metrics).toHaveAttribute("href", "/metrics");
		fireEvent.click(metrics);
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("shows the app version in the sign-out row", () => {
		vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "0.3.1");
		renderWithMessages(
			<UserMenu name="Lucas" email="lucas@plei.com" image={null} isAdmin={false} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

		expect(screen.queryByRole("menuitem", { name: "App metrics" })).not.toBeInTheDocument();
		const version = screen.getByText("Version 0.3.1");
		expect(version.parentElement).toBe(
			screen.getByRole("menuitem", { name: "Sign out" }).parentElement,
		);
	});

	it("falls back to the email when there is no name", () => {
		renderWithMessages(
			<UserMenu name={null} email="lucas@plei.com" image={null} isAdmin={false} />,
		);
		fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
		expect(screen.getAllByText("lucas@plei.com")).toHaveLength(2);
	});

	it("closes on Escape and on an outside click, but not on an inside click", () => {
		renderWithMessages(
			<UserMenu name="Lucas" email="lucas@plei.com" image={null} isAdmin={false} />,
		);
		const trigger = screen.getByRole("button", { name: "Account menu" });

		fireEvent.click(trigger);
		fireEvent.keyDown(window, { key: "Enter" });
		expect(screen.getByRole("menu")).toBeInTheDocument();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();

		fireEvent.click(trigger);
		fireEvent.mouseDown(screen.getByRole("menu"));
		expect(screen.getByRole("menu")).toBeInTheDocument();
		fireEvent.mouseDown(document.body);
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});
});
