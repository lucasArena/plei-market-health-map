"use client";

import { Feedback } from "@/presentation/components/feedbacks/Feedback/FeedbackComponent";
import type { AppHeaderProps } from "@/presentation/components/layout/AppHeader/AppHeaderComponent.types";
import { MarketSummaryToggle } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";

export function AppHeader({ user }: Readonly<AppHeaderProps>) {
	const { setSearchSlot } = useHeaderSlot();
	return (
		<header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end p-4">
			<div className="flex min-w-0 flex-1 items-center justify-end gap-2">
				<div
					ref={setSearchSlot}
					data-testid="header-search-slot"
					className="flex min-w-0 flex-1 justify-end"
				/>
				<MarketSummaryToggle />
			</div>
			<div className="pointer-events-auto">
				<Feedback user={user} />
			</div>
		</header>
	);
}
