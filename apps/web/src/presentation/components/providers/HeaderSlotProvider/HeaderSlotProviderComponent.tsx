"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
	HeaderSlotContextValue,
	HeaderSlotProviderProps,
} from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent.types";

const HeaderSlotContext = createContext<HeaderSlotContextValue>({
	searchSlot: null,
	setSearchSlot: () => undefined,
	legendSlot: null,
	setLegendSlot: () => undefined,
});

export function HeaderSlotProvider({ children }: Readonly<HeaderSlotProviderProps>) {
	const [searchSlot, setSearchSlot] = useState<HTMLElement | null>(null);
	const [legendSlot, setLegendSlot] = useState<HTMLElement | null>(null);
	const value = useMemo(
		() => ({ searchSlot, setSearchSlot, legendSlot, setLegendSlot }),
		[legendSlot, searchSlot],
	);
	return <HeaderSlotContext.Provider value={value}>{children}</HeaderSlotContext.Provider>;
}

export function useHeaderSlot(): HeaderSlotContextValue {
	return useContext(HeaderSlotContext);
}
