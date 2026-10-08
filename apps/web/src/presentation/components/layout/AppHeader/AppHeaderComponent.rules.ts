"use client";

import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";

export function useAppHeaderRules() {
	const { setSearchSlot } = useHeaderSlot();
	return { setSearchSlot };
}
