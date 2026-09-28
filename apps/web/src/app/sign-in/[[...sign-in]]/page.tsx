import { SignIn } from "@clerk/nextjs";
import { CLERK_SIGN_IN_APPEARANCE } from "@/lib/clerk/clerk-appearance";

export default function SignInPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background p-4">
			<SignIn appearance={CLERK_SIGN_IN_APPEARANCE} />
		</div>
	);
}
