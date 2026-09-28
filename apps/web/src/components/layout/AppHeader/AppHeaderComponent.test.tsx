import { screen } from "@testing-library/react";
import { AppHeader } from "@/components/layout/AppHeader/AppHeaderComponent";
import { renderWithMessages } from "@/test/render-with-messages";

vi.mock("@clerk/nextjs", () => ({ UserButton: () => <div data-testid="user-button" /> }));

describe("AppHeader", () => {
	it("shows only the Plei logo and the account avatar", () => {
		renderWithMessages(<AppHeader />);

		expect(screen.getByRole("img", { name: "Market Health Map" })).toBeInTheDocument();
		expect(screen.getByTestId("user-button")).toBeInTheDocument();
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
	});
});
