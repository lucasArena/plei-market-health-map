export const SIGN_IN_ERRORS = ["domain", "missing-email"] as const;

export type SignInErrorCode = (typeof SIGN_IN_ERRORS)[number];

export interface SignInCandidate {
	email: string | null | undefined;
	emailVerified: boolean | null | undefined;
	domain: string;
}
