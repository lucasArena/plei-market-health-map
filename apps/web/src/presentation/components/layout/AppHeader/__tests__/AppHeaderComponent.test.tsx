import { screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { AppHeader } from "@/presentation/components/layout/AppHeader/AppHeaderComponent";

vi.mock("@/infrastructure/auth/actions", () => ({ signOutOfApp: vi.fn() }));

describe("AppHeader", () => {
	it("shows only the Plei logo and the account avatar", () => {
		renderWithMessages(
			<AppHeader user={{ name: "Lucas Arena", email: "lucas@plei.com", image: null }} />,
		);

		expect(screen.getByRole("img", { name: "Market Health Map" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
	});
});
