"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useAppHeaderRules } from "@/components/layout/AppHeader/AppHeaderComponent.rules";

export function AppHeader() {
	const { appName, navItems } = useAppHeaderRules();
	return (
		<header className="z-10 flex shrink-0 items-center justify-between border-b bg-background px-4 py-3">
			<div className="flex items-center gap-6">
				<div className="flex items-center gap-3">
					<Image src="/images/plei-logo.svg" alt="" width={28} height={28} priority />
					<h1 className="text-base font-semibold">{appName}</h1>
				</div>
				<nav className="flex items-center gap-1">
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							aria-current={item.isActive ? "page" : undefined}
							className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
						>
							{item.label}
						</Link>
					))}
				</nav>
			</div>
			<UserButton />
		</header>
	);
}
