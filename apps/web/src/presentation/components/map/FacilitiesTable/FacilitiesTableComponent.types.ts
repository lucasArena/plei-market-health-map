import type { FacilityGameChangeView } from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";
import type { GamesTrendDirection } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";

export type FacilitiesTableMessages = Messages["facilitiesTable"];

export type FacilityHealthStatus = "attention" | "watch" | "onTrack";

export interface FacilitiesTableProps {
	facilities: FacilityGameChangeView[];
	marketName: string;
}

export interface FacilityChangeView {
	label: string;
	direction: GamesTrendDirection;
}

export interface FacilitiesTableRowView {
	id: string;
	name: string;
	status: FacilityHealthStatus;
	statusLabel: string;
	previousLabel: string;
	games: number;
	gamesLabel: string;
	change: number;
	changeView: FacilityChangeView | null;
	openLabel: string;
}

export type FacilitiesTableEntry =
	| { kind: "row"; key: string; row: FacilitiesTableRowView }
	| { kind: "gap"; key: string };

export interface FacilityStatusStyle {
	dot: string;
	halo: string;
	label: string;
}
