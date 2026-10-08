"use client";

import { useMemo, useState } from "react";
import type { HeaderSlotContextValue } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent.types";

export function useHeaderSlotProviderRules(): HeaderSlotContextValue {
	const [searchSlot, setSearchSlot] = useState<HTMLElement | null>(null);
	const [legendSlot, setLegendSlot] = useState<HTMLElement | null>(null);
	return useMemo(
		() => ({ searchSlot, setSearchSlot, legendSlot, setLegendSlot }),
		[legendSlot, searchSlot],
	);
}
