"use client";

import Link from "next/link";
import { useAdminTabsRules } from "@/presentation/components/layout/AdminTabs/AdminTabsComponent.rules";
import type { AdminTabsProps } from "@/presentation/components/layout/AdminTabs/AdminTabsComponent.types";

const TAB_CLASS = {
	active: "bg-background text-foreground shadow-sm",
	idle: "text-muted-foreground hover:text-foreground",
};

export function AdminTabs({ active }: Readonly<AdminTabsProps>) {
	const { label, tabs } = useAdminTabsRules();
	return (
		<nav aria-label={label} className="inline-flex rounded-lg bg-muted p-1 text-sm">
			{tabs.map((tab) => (
				<Link
					key={tab.tab}
					href={{ pathname: tab.href }}
					aria-current={tab.tab === active ? "page" : undefined}
					className={`rounded-md px-3 py-1.5 font-medium transition-colors ${TAB_CLASS[tab.tab === active ? "active" : "idle"]}`}
				>
					{tab.label}
				</Link>
			))}
		</nav>
	);
}
