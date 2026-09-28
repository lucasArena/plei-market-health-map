import { SignUp } from "@clerk/nextjs";
import { CLERK_APPEARANCE } from "@/lib/clerk/clerk-appearance";

export default function SignUpPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background p-4">
			<SignUp appearance={CLERK_APPEARANCE} />
		</div>
	);
}
