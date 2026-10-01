"use client";

import type { MapBrandRules } from "@/presentation/components/layout/MapBrand/MapBrandComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function useMapBrandRules(): MapBrandRules {
	const { messages } = useMessages();
	return { label: messages.common.appName };
}
