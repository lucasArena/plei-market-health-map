"use client";

import type { AppHeaderProps } from "@/presentation/components/layout/AppHeader/AppHeaderComponent.types";
import { UserMenu } from "@/presentation/components/layout/UserMenu/UserMenuComponent";

export function AppHeader({ user }: Readonly<AppHeaderProps>) {
	return (
		<header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end p-4">
			<div className="pointer-events-auto flex size-11 items-center justify-center rounded-full border bg-background/95 shadow-md backdrop-blur">
				<UserMenu {...user} />
			</div>
		</header>
	);
}
