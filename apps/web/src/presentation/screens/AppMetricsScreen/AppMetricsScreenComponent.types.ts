import type { Messages } from "@market-health-map/core/i18n";
import type { WeeklyActivityPointView } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent.types";

export type AppMetricsMessages = Messages["appMetrics"];

export type AppMetricsStatus = "loading" | "error" | "ready";

export interface AppMetricsPersonRow {
	key: string;
	name: string;
	email: string | null;
	isTarget: boolean;
	days: string;
	visits: string;
	minutes: string;
	topFeature: string;
	lastSeen: string;
}

export interface AppMetricsWeeklySeries {
	all: WeeklyActivityPointView[];
	targets: WeeklyActivityPointView[];
}
