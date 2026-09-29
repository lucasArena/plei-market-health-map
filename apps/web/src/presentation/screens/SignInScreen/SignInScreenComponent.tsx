"use client";

import Image from "next/image";
import { signInWithGoogle } from "@/infrastructure/auth/actions";
import { GoogleButton } from "@/presentation/components/buttons/GoogleButton/GoogleButtonComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { resolveSignInError } from "@/presentation/screens/SignInScreen/SignInScreenComponent.rules";
import type { SignInScreenProps } from "@/presentation/screens/SignInScreen/SignInScreenComponent.types";

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
