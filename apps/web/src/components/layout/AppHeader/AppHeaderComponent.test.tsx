import { screen } from "@testing-library/react";
import { AppHeader } from "@/components/layout/AppHeader/AppHeaderComponent";
import { renderWithMessages } from "@/test/render-with-messages";

const mockPathname = vi.fn();

vi.mock("@clerk/nextjs", () => ({ UserButton: () => <div data-testid="user-button" /> }));
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname() }));

describe("AppHeader", () => {
	it("shows the app name, navigation and account menu", () => {
		mockPathname.mockReturnValue("/");

		renderWithMessages(<AppHeader />);

		expect(screen.getByRole("heading", { name: "Market Health Map" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Map" })).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Adoption" })).not.toHaveAttribute("aria-current");
		expect(screen.getByTestId("user-button")).toBeInTheDocument();
	});

	it("highlights the adoption page", () => {
		mockPathname.mockReturnValue("/adoption");

		renderWithMessages(<AppHeader />);

		expect(screen.getByRole("link", { name: "Adoption" })).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Map" })).not.toHaveAttribute("aria-current");
	});
});
