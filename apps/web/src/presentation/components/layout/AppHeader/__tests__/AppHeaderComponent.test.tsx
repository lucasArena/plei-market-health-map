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
						canViewAppMetrics: false,
					}}
				/>
			</Wrapper>,
		);

		expect(screen.getByRole("button", { name: "Market summary" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
		expect(screen.queryByRole("img", { name: "Market Health Map" })).not.toBeInTheDocument();
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
	});

	it("puts the search slot, the summary toggle and the avatar in one gapped row", () => {
		const { Wrapper } = createQueryWrapper();
		renderWithMessages(
			<Wrapper>
				<AppHeader
					user={{
						name: "Lucas Arena",
						email: "lucas@plei.com",
						image: null,
						canViewAppMetrics: false,
					}}
				/>
			</Wrapper>,
		);

		const slot = screen.getByTestId("header-search-slot");
		const row = slot.parentElement;
		expect(row).toHaveClass("flex", "gap-2", "min-w-0", "flex-1");
		expect(slot).toHaveClass("min-w-0", "flex-1");
		expect(row?.firstElementChild).toBe(slot);
		expect(row?.contains(screen.getByRole("button", { name: "Market summary" }))).toBe(true);
		expect(screen.getByRole("button", { name: "Market summary" })).toHaveClass("glass");
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
