"use client";

import { PeriodSwitch } from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent";
import type { AppHeaderProps } from "@/presentation/components/layout/AppHeader/AppHeaderComponent.types";
import { MapBrand } from "@/presentation/components/layout/MapBrand/MapBrandComponent";
import { MarketSummaryToggle } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent";
import { MetricDrillDownToggle } from "@/presentation/components/layout/MetricDrillDownToggle/MetricDrillDownToggleComponent";
import { UserMenu } from "@/presentation/components/layout/UserMenu/UserMenuComponent";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";

export function AppHeader({ user }: Readonly<AppHeaderProps>) {
	const { setSearchSlot } = useHeaderSlot();
	return (
		<header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-[var(--map-frame)]">
			<MapBrand />
			<div
				ref={setSearchSlot}
				data-testid="header-search-slot"
				className="pointer-events-none absolute top-[var(--map-frame)] left-1/2 w-[min(24rem,calc(100%-24rem))] -translate-x-1/2 max-sm:top-[calc(var(--map-frame)+40px)] max-sm:left-[var(--map-frame)] max-sm:w-[calc(100%-2*var(--map-frame)-40px)] max-sm:translate-x-0"
			/>
			<div className="flex items-center justify-end gap-2">
				<PeriodSwitch />
				<MetricDrillDownToggle />
				<MarketSummaryToggle />
			</div>
			<UserMenu {...user} />
		</header>
	);
}
