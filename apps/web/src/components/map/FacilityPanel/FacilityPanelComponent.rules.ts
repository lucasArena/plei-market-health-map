"use client";

import { useEffect } from "react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import type { FacilityPanelProps } from "@/components/map/FacilityPanel/FacilityPanelComponent.types";

export function useFacilityPanelRules({ facility, onClose }: FacilityPanelProps) {
	const { messages } = useMessages();

	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [onClose]);

	return { facility, messages: messages.facility, onClose };
}
