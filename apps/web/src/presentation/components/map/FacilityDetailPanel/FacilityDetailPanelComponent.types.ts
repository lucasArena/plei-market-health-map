import type { Messages } from "@market-health-map/core/i18n";
import type { WeeklyActivityPointView } from "@/presentation/components/map/WeeklyActivityChart/WeeklyActivityChartComponent.types";

export const ChangeDirection = { up: "up", down: "down", flat: "flat" } as const;

export type DetailMessages = Messages["facilityDetail"];

export interface FacilityDetailPanelProps {
	facilityId: string;
	isClosing: boolean;
	onClose: () => void;
	onClosed: () => void;
}

export type FacilityDetailStatus = "loading" | "error" | "ready";

export type StatDirection = (typeof ChangeDirection)[keyof typeof ChangeDirection];

export interface FacilityStatTile {
	key: string;
	label: string;
	value: string;
	hint: string | null;
	hintDirection: StatDirection;
}

export interface FacilityDetailViewModel {
	name: string;
	address: string;
	avatarUrl: string | null;
	summary: string;
	tiles: FacilityStatTile[];
	weeklyActivity: WeeklyActivityPointView[];
	lastPlayedLabel: string;
}

export interface DetailFormatters {
	number: Intl.NumberFormat;
	decimal: Intl.NumberFormat;
	plural: Intl.PluralRules;
	dayWithYear: Intl.DateTimeFormat;
	week: Intl.DateTimeFormat;
}
