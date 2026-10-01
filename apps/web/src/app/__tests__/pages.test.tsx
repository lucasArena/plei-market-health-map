import { render, screen } from "@testing-library/react";
import FeatureFlagsPage from "@/app/(protected)/feature-flags/page";
import AppMetricsPage from "@/app/(protected)/metrics/page";
import HomePage from "@/app/(protected)/page";
import OfflinePage from "@/app/~offline/page";
import manifest from "@/app/manifest";
import SignInPage from "@/app/sign-in/page";

const mockAccess = vi.fn();
const mockSignInScreen = vi.fn();
const mockRedirect = vi.fn((url: string) => {
	throw new Error(`redirect:${url}`);
});

vi.mock("next/navigation", () => ({
	redirect: (url: string) => mockRedirect(url),
	notFound: () => {
		throw new Error("not-found");
	},
}));
vi.mock("@/infrastructure/auth/internal-access", () => ({ getInternalAccess: () => mockAccess() }));
vi.mock("@market-health-map/server", () => ({ getAllowedEmailDomain: () => "plei.com" }));

vi.mock("@/presentation/screens/SignInScreen/SignInScreenComponent", () => ({
	SignInScreen: (props: unknown) => {
		mockSignInScreen(props);
		return <div data-testid="sign-in-screen" />;
	},
}));

vi.mock("@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent", () => ({
	FacilitiesMapScreen: () => <div data-testid="facilities-map" />,
}));

vi.mock("@/presentation/screens/AppMetricsScreen/AppMetricsScreenComponent", () => ({
	AppMetricsScreen: () => <div data-testid="app-metrics" />,
}));

vi.mock("@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent", () => ({
	FeatureFlagsScreen: () => <div data-testid="feature-flags" />,
}));

vi.mock("@/infrastructure/i18n/get-request-locale", () => ({
	getRequestLocale: async () => "pt-BR",
}));

describe("pages", () => {
	beforeEach(() => vi.clearAllMocks());

	it("renders the sign-in screen with the error feedback from the URL", async () => {
		mockAccess.mockResolvedValue({ status: "anonymous" });

		render(
			await SignInPage({
				searchParams: Promise.resolve({ error: "domain", email: "someone@gmail.com" }),
			}),
		);

		expect(screen.getByTestId("sign-in-screen")).toBeInTheDocument();
		expect(mockSignInScreen).toHaveBeenCalledWith({
			error: "domain",
			email: "someone@gmail.com",
			domain: "plei.com",
		});
	});

	it("renders the sign-in screen without feedback", async () => {
		mockAccess.mockResolvedValue({ status: "anonymous" });

		render(await SignInPage({ searchParams: Promise.resolve({}) }));

		expect(mockSignInScreen).toHaveBeenCalledWith({ error: null, email: null, domain: "plei.com" });
	});

	it("sends signed-in Plei users straight to the map", async () => {
		mockAccess.mockResolvedValue({
			status: "allowed",
			userId: "g-1",
			email: "lucas@plei.com",
			name: null,
			image: null,
		});

		await expect(SignInPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/");
	});

	it("renders the facilities map on the home page", () => {
		render(<HomePage />);
		expect(screen.getByTestId("facilities-map")).toBeInTheDocument();
	});

	it("shows App metrics only to its viewers", async () => {
		const allowed = { status: "allowed", email: "lucas@plei.com", isAdmin: true };
		mockAccess.mockResolvedValue(allowed);
		render(await AppMetricsPage());
		expect(screen.getByTestId("app-metrics")).toBeInTheDocument();

		mockAccess.mockResolvedValue({ ...allowed, isAdmin: false });
		await expect(AppMetricsPage()).rejects.toThrow("not-found");
		mockAccess.mockResolvedValue({ status: "anonymous" });
		await expect(AppMetricsPage()).rejects.toThrow("not-found");
	});

	it("shows feature flags only to admins", async () => {
		const allowed = { status: "allowed", email: "lucas@plei.com", isAdmin: true };
		mockAccess.mockResolvedValue(allowed);
		render(await FeatureFlagsPage());
		expect(screen.getByTestId("feature-flags")).toBeInTheDocument();

		mockAccess.mockResolvedValue({ ...allowed, isAdmin: false });
		await expect(FeatureFlagsPage()).rejects.toThrow("not-found");
	});

	it("renders a localized offline fallback", async () => {
		render(await OfflinePage());
		expect(screen.getByRole("heading", { name: "Você está offline" })).toBeInTheDocument();
	});

	it("describes the installable app", () => {
		expect(manifest()).toMatchObject({ name: "Market Health Map", display: "standalone" });
	});
});
