"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
	MapScope,
	MapScopeContextValue,
	MapScopeProviderProps,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

export const ALL_MARKETS_SCOPE: MapScope = { kind: "all" };

const MapScopeContext = createContext<MapScopeContextValue>({
	scope: ALL_MARKETS_SCOPE,
	setScope: () => undefined,
});

export function MapScopeProvider({ children }: Readonly<MapScopeProviderProps>) {
	const [scope, setScope] = useState<MapScope>(ALL_MARKETS_SCOPE);
	const value = useMemo(() => ({ scope, setScope }), [scope]);
	return <MapScopeContext.Provider value={value}>{children}</MapScopeContext.Provider>;
}

export function useMapScope(): MapScopeContextValue {
	return useContext(MapScopeContext);
}
