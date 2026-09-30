"use client";

import Image from "next/image";
import type { AppHeaderProps } from "@/presentation/components/layout/AppHeader/AppHeaderComponent.types";
import { MarketSummaryToggle } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent";
import { UserMenu } from "@/presentation/components/layout/UserMenu/UserMenuComponent";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function AppHeader({ user }: Readonly<AppHeaderProps>) {
	const { messages } = useMessages();
	const { setSearchSlot } = useHeaderSlot();
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
			<div className="flex min-w-0 flex-1 items-center justify-end gap-2 pl-2">
				<div
					ref={setSearchSlot}
					data-testid="header-search-slot"
					className="flex min-w-0 flex-1 justify-end"
				/>
				<MarketSummaryToggle />
				<div className="pointer-events-auto flex size-11 items-center justify-center rounded-full border bg-background/95 shadow-md backdrop-blur">
					<UserMenu {...user} />
				</div>
			</div>
		</header>
	);
}
