"use client";

import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function useAiSummarySkeletonRules() {
	const { messages } = useMessages();
	return { label: messages.facilityAi.label };
}
