import { signInWithGoogle, signOutOfApp } from "@/infrastructure/auth/actions";

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/infrastructure/auth/auth", () => ({
	signIn: (...args: unknown[]) => mockSignIn(...args),
	signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe("auth actions", () => {
	it("starts Google sign-in and returns to the map", async () => {
		await signInWithGoogle();
		expect(mockSignIn).toHaveBeenCalledWith("google", { redirectTo: "/" });
	});

	it("signs out back to the sign-in page", async () => {
		await signOutOfApp();
		expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
	});
});
