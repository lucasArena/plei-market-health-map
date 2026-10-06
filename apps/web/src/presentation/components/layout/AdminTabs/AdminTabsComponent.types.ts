export type AdminTab = "metrics" | "featureFlags";

export interface AdminTabsProps {
	active: AdminTab;
}

export interface AdminTabLink {
	tab: AdminTab;
	href: "/admin/metrics" | "/admin/feature-flags";
	label: string;
}
