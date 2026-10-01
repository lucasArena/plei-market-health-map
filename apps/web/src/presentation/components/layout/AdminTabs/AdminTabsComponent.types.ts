export type AdminTab = "metrics" | "featureFlags";

export interface AdminTabsProps {
	active: AdminTab;
}

export interface AdminTabLink {
	tab: AdminTab;
	href: "/metrics" | "/feature-flags";
	label: string;
}
