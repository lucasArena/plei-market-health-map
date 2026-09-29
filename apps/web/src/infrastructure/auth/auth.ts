import { getAllowedEmailDomain, trackSignIn } from "@market-health-map/server";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { evaluateSignIn } from "@/infrastructure/auth/sign-in-policy";

const domain = getAllowedEmailDomain();

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		Google({
			authorization: { params: { hd: domain, prompt: "select_account" } },
		}),
	],
	pages: { signIn: "/sign-in", error: "/sign-in" },
	session: { strategy: "jwt" },
	trustHost: true,
	callbacks: {
		signIn: ({ profile }) =>
			evaluateSignIn({
				email: profile?.email,
				emailVerified: profile?.email_verified as boolean | undefined,
				domain,
			}),
	},
	events: {
		signIn: async ({ user, profile }) => {
			await trackSignIn({ userId: profile?.sub ?? user.id ?? null, email: user.email ?? null });
		},
	},
});
