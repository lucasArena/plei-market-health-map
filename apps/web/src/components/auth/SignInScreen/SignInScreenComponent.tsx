"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";
import { resolveSignInError } from "@/components/auth/SignInScreen/SignInScreenComponent.rules";
import type {
	GoogleButtonProps,
	SignInScreenProps,
} from "@/components/auth/SignInScreen/SignInScreenComponent.types";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import { signInWithGoogle } from "@/server/auth/actions";

function GoogleButton({ label, pendingLabel }: Readonly<GoogleButtonProps>) {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
		>
			<svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 rounded-full bg-white p-0.5">
				<path
					fill="#4285F4"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
				/>
				<path
					fill="#34A853"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
				/>
				<path
					fill="#FBBC05"
					d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
				/>
				<path
					fill="#EA4335"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
				/>
			</svg>
			{pending ? pendingLabel : label}
		</button>
	);
}

export function SignInScreen(props: Readonly<SignInScreenProps>) {
	const { messages } = useMessages();
	const errorMessage = resolveSignInError(props, messages.auth);

	return (
		<div className="flex min-h-dvh items-center justify-center bg-background p-4">
			<div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border bg-card p-8 text-center shadow-lg">
				<Image src="/images/plei-logo.svg" alt="" width={56} height={56} priority />
				<div className="space-y-1">
					<h1 className="text-xl font-semibold">{messages.common.appName}</h1>
					<p className="text-sm text-muted-foreground">{messages.auth.subtitle}</p>
				</div>
				{errorMessage && (
					<p
						role="alert"
						className="w-full rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
					>
						{errorMessage}
					</p>
				)}
				<form action={signInWithGoogle} className="w-full">
					<GoogleButton
						label={messages.auth.continueWithGoogle}
						pendingLabel={messages.auth.redirecting}
					/>
				</form>
			</div>
		</div>
	);
}
