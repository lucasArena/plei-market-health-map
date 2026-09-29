"use client";

import { useFormStatus } from "react-dom";
import type { GoogleButtonProps } from "@/presentation/components/buttons/GoogleButton/GoogleButtonComponent.types";

export function useGoogleButtonRules({ label, pendingLabel }: GoogleButtonProps) {
	const { pending } = useFormStatus();
	return { isPending: pending, text: pending ? pendingLabel : label };
}
