import type { Route } from "next";

export interface AppNavItem {
	href: Route;
	label: string;
	isActive: boolean;
}
