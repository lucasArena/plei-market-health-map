"use client";

import { createContext, useContext } from "react";
import { useHeaderSlotProviderRules } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent.rules";
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
	const value = useHeaderSlotProviderRules();
	return <HeaderSlotContext.Provider value={value}>{children}</HeaderSlotContext.Provider>;
}

export function useHeaderSlot(): HeaderSlotContextValue {
	return useContext(HeaderSlotContext);
}
