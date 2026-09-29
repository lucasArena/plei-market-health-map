import { screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { SignInScreen } from "@/presentation/screens/SignInScreen/SignInScreenComponent";
import { resolveSignInError } from "@/presentation/screens/SignInScreen/SignInScreenComponent.rules";

const mockFormStatus = vi.fn(() => ({ pending: false }));

vi.mock("@/infrastructure/auth/actions", () => ({ signInWithGoogle: vi.fn() }));
vi.mock("react-dom", async (importOriginal) => ({
	...(await importOriginal<object>()),
	useFormStatus: () => mockFormStatus(),
}));

const BASE = { error: null, email: null, domain: "plei.com" };

describe("SignInScreen", () => {
	it("shows a single Google sign-in button", () => {
		renderWithMessages(<SignInScreen {...BASE} />);

		expect(screen.getByRole("heading", { name: "Market Health Map" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Continue with Google" })).toHaveAttribute(
			"type",
			"submit",
		);
		expect(screen.getAllByRole("button")).toHaveLength(1);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("tells a blocked user why they cannot enter", () => {
		renderWithMessages(<SignInScreen {...BASE} error="domain" email="someone@gmail.com" />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"someone@gmail.com isn't a Plei account. Only @plei.com Google accounts can sign in.",
		);
	});

	it("disables the button while redirecting to Google", () => {
		mockFormStatus.mockReturnValueOnce({ pending: true });
		renderWithMessages(<SignInScreen {...BASE} />);

		expect(screen.getByRole("button", { name: "Redirecting…" })).toBeDisabled();
	});
});

describe("resolveSignInError", () => {
	const messages = EN_MESSAGES.auth;

	it("has no message without an error", () => {
		expect(resolveSignInError(BASE, messages)).toBeNull();
	});

	it("explains a missing email and falls back for unknown errors", () => {
		expect(resolveSignInError({ ...BASE, error: "missing-email" }, messages)).toBe(
			messages.missingEmailError,
		);
		expect(resolveSignInError({ ...BASE, error: "OAuthCallbackError" }, messages)).toBe(
			messages.genericError,
		);
	});

	it("still explains a domain block without the email", () => {
		expect(resolveSignInError({ ...BASE, error: "domain" }, messages)).toContain(
			"— isn't a Plei account",
		);
	});
});
