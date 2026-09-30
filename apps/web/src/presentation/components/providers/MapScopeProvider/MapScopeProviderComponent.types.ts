import type { ReactNode } from "react";

export type MapScope =
	| { kind: "all" }
	| { kind: "market"; id: string; name: string }
	| { kind: "facility"; id: string; name: string; marketName: string };

export interface MapScopeContextValue {
	scope: MapScope;
	setScope(scope: MapScope): void;
}

export interface MapScopeProviderProps {
	children: ReactNode;
}
