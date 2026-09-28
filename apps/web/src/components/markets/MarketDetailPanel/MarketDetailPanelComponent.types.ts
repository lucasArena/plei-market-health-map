import type { FacilityView } from "@market-health-map/application";
import type { MarketHealthStatus } from "@market-health-map/domain";

export interface MarketDetailPanelProps {
	marketId: string;
	onClose: () => void;
}

export type MarketDetailStatus = "loading" | "error" | "ready";

export interface MarketIndicator {
	key: string;
	label: string;
	value: string;
	suffix?: string;
}

export interface MarketHeader {
	title: string;
	subtitle: string;
	statusLabel: string;
	statusColor: string;
	healthStatus: MarketHealthStatus;
}

export interface FacilityRow extends FacilityView {
	playersLabel: string;
	gamesLabel: string;
	utilizationLabel: string;
}
