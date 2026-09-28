import { render, screen } from "@testing-library/react";
import HomePage from "@/app/(protected)/page";
import OfflinePage from "@/app/~offline/page";
import manifest from "@/app/manifest";
import SignInPage from "@/app/sign-in/[[...sign-in]]/page";
import SignUpPage from "@/app/sign-up/[[...sign-up]]/page";
import { CLERK_APPEARANCE, CLERK_SIGN_IN_APPEARANCE } from "@/lib/clerk/clerk-appearance";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock("@clerk/nextjs", () => ({
	SignIn: (props: unknown) => {
		mockSignIn(props);
		return <div data-testid="clerk-sign-in" />;
	},
	SignUp: (props: unknown) => {
		mockSignUp(props);
		return <div data-testid="clerk-sign-up" />;
	},
}));

vi.mock("@/components/map/FacilitiesMap/FacilitiesMapComponent", () => ({
	FacilitiesMap: () => <div data-testid="facilities-map" />,
}));

vi.mock("@/server/i18n/get-request-locale", () => ({
	getRequestLocale: async () => "pt-BR",
}));

describe("pages", () => {
	it("renders the Clerk sign-in with the Plei appearance", () => {
		render(<SignInPage />);
		expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
		expect(mockSignIn).toHaveBeenCalledWith({ appearance: CLERK_SIGN_IN_APPEARANCE });
	});

	it("renders the Clerk sign-up with the Plei appearance", () => {
		render(<SignUpPage />);
		expect(mockSignUp).toHaveBeenCalledWith({ appearance: CLERK_APPEARANCE });
	});

	it("renders the facilities map on the home page", () => {
		render(<HomePage />);
		expect(screen.getByTestId("facilities-map")).toBeInTheDocument();
	});

	it("renders a localized offline fallback", async () => {
		render(await OfflinePage());
		expect(screen.getByRole("heading", { name: "Você está offline" })).toBeInTheDocument();
	});

	it("describes the installable app", () => {
		expect(manifest()).toMatchObject({ name: "Market Health Map", display: "standalone" });
	});
});
