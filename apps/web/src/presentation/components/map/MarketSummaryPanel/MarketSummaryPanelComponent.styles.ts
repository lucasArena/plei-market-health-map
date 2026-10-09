import type { SupplyDemandStatus } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";
export const MARKET_SUMMARY_PANEL_CLASS =
	"pointer-events-auto fixed top-[calc(var(--map-frame)+32px+8px)] right-[var(--map-frame)] z-30 flex max-h-[calc(100dvh-var(--map-frame)-32px-8px-var(--map-frame))] w-[min(28rem,calc(100vw-2*var(--map-frame)))] flex-col overflow-hidden max-sm:top-[calc(var(--map-frame)+80px)] max-sm:max-h-[calc(100dvh-2*var(--map-frame)-80px)] map-glass rounded-[var(--map-radius)] border shadow-[var(--map-shadow)]";

export const SUPPLY_DEMAND_PILL: Record<SupplyDemandStatus, string> = {
	underSupplied: "bg-[#fef3c7] text-[#92400e]",
	balanced: "bg-[#dcfce7] text-[#166534]",
	overSupplied: "bg-[#e0e7ff] text-[#3730a3]",
};
