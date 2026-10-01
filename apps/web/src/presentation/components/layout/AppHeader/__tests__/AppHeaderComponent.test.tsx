import { screen } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { AppHeader } from "@/presentation/components/layout/AppHeader/AppHeaderComponent";

vi.mock("@/infrastructure/auth/actions", () => ({ signOutOfApp: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("AppHeader", () => {
	it("shows the market summary toggle and the account avatar", () => {
		const { Wrapper } = createQueryWrapper();
		renderWithMessages(
			<Wrapper>
				<AppHeader
					user={{
						name: "Lucas Arena",
						email: "lucas@plei.com",
						image: null,
						isAdmin: false,
					}}
				/>
			</Wrapper>,
		);

		expect(screen.getByRole("button", { name: "Market summary" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Market Health Map" })).toBeInTheDocument();
		expect(screen.queryByRole("img", { name: "Market Health Map" })).not.toBeInTheDocument();
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
	});

	it("centers the search, keeps the summary toggle on the right, and leaves the account menu bottom-left", () => {
		const { Wrapper } = createQueryWrapper();
		renderWithMessages(
			<Wrapper>
				<AppHeader
					user={{
						name: "Lucas Arena",
						email: "lucas@plei.com",
						image: null,
						isAdmin: false,
					}}
				/>
			</Wrapper>,
		);

		const slot = screen.getByTestId("header-search-slot");
		expect(slot).toHaveClass("left-1/2", "-translate-x-1/2");
		expect(slot.parentElement?.tagName).toBe("HEADER");
		const row = screen.getByRole("button", { name: "Market summary" }).parentElement;
		expect(row).toHaveClass("justify-end", "gap-2");
		expect(row?.contains(slot)).toBe(false);
		expect(screen.getByRole("button", { name: "Market summary" })).toHaveClass(
			"map-glass",
			"map-icon-button",
			"size-[32px]",
		);
		expect(screen.getByRole("link", { name: "Market Health Map" })).toHaveClass(
			"map-glass",
			"pl-[8px]",
			"pr-[10px]",
		);
		const account = screen.getByRole("button", { name: "Account menu" });
		expect(row?.contains(account)).toBe(false);
		expect(account.parentElement).toHaveClass(
			"fixed",
			"bottom-[var(--map-profile-bottom)]",
			"left-[var(--map-frame)]",
		);
		expect(account).toHaveClass("map-glass", "size-[var(--map-profile-size)]", "rounded-full");
		expect(screen.queryByRole("button", { name: "Send feedback" })).not.toBeInTheDocument();
	});
});
