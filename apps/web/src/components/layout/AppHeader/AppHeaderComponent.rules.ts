"use client";

import type { Messages } from "@market-health-map/i18n";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import type { AppNavItem } from "@/components/layout/AppHeader/AppHeaderComponent.types";

export function buildNavItems(messages: Messages["nav"], pathname: string): AppNavItem[] {
	return [
		{ href: "/", label: messages.map, isActive: pathname === "/" },
		{ href: "/adoption", label: messages.adoption, isActive: pathname.startsWith("/adoption") },
	];
}

export function useAppHeaderRules() {
	const { messages } = useMessages();
	const pathname = usePathname();
	const navItems = useMemo(() => buildNavItems(messages.nav, pathname), [messages.nav, pathname]);
	return { appName: messages.common.appName, navItems };
}
