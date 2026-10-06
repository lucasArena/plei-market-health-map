"use client";

import type { AdminTabLink } from "@/presentation/components/layout/AdminTabs/AdminTabsComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function useAdminTabsRules() {
	const { messages } = useMessages();
	const tabs: AdminTabLink[] = [
		{ tab: "metrics", href: "/admin/metrics", label: messages.admin.metricsTab },
		{ tab: "featureFlags", href: "/admin/feature-flags", label: messages.admin.featureFlagsTab },
	];
	return { label: messages.admin.tabsLabel, tabs };
}
