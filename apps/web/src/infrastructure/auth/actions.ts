"use server";

import { signIn, signOut } from "@/infrastructure/auth/auth";

export async function signInWithGoogle() {
	await signIn("google", { redirectTo: "/" });
}

export async function signOutOfApp() {
	await signOut({ redirectTo: "/sign-in" });
}
