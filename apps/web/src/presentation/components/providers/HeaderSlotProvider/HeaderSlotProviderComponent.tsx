"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
	HeaderSlotContextValue,
	HeaderSlotProviderProps,
} from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent.types";

const HeaderSlotContext = createContext<HeaderSlotContextValue>({
	searchSlot: null,
	setSearchSlot: () => undefined,
});

// Lets a screen render its search into the header row (through a portal), so the
// search, the summary toggle and the avatar share one flex row with one gap.
export function HeaderSlotProvider({ children }: Readonly<HeaderSlotProviderProps>) {
	const [searchSlot, setSearchSlot] = useState<HTMLElement | null>(null);
	const value = useMemo(() => ({ searchSlot, setSearchSlot }), [searchSlot]);
	return <HeaderSlotContext.Provider value={value}>{children}</HeaderSlotContext.Provider>;
}

export function useHeaderSlot(): HeaderSlotContextValue {
	return useContext(HeaderSlotContext);
}
