"use client";

import Image from "next/image";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import type { AppHeaderProps } from "@/components/layout/AppHeader/AppHeaderComponent.types";
import { UserMenu } from "@/components/layout/UserMenu/UserMenuComponent";

export function AppHeader({ user }: Readonly<AppHeaderProps>) {
	const { messages } = useMessages();
	return (
		<header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4">
			<div className="pointer-events-auto flex size-11 items-center justify-center rounded-full border bg-background/95 shadow-md backdrop-blur">
				<Image
					src="/images/plei-logo.svg"
					alt={messages.common.appName}
					width={28}
					height={28}
					priority
				/>
			</div>
			<div className="pointer-events-auto flex size-11 items-center justify-center rounded-full border bg-background/95 shadow-md backdrop-blur">
				<UserMenu {...user} />
			</div>
		</header>
	);
}
