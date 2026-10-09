import type { GamesTrendDirection } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";

export type WeeklyBarTone =
	| "previous"
	| "flat"
	| "down1"
	| "down2"
	| "down3"
	| "up1"
	| "up2"
	| "up3";

export interface WeeklyBarPoint {
	key: string;
	value: number;
	valueLabel: string;
	weekLabel: string;
	ariaLabel: string;
	tone: WeeklyBarTone;
	isLatest: boolean;
}

export interface WeeklyBarsCaption {
	direction: GamesTrendDirection;
	label: string;
	sequence: string;
}

export interface WeeklyBarGroup {
	key: string;
	label: string;
	weeks: number;
	isCurrent: boolean;
}

export interface WeeklyBarsProps {
	title: string;
	aside: string;
	caption: WeeklyBarsCaption | null;
	points: WeeklyBarPoint[];
	groups: WeeklyBarGroup[];
	testId: string;
}
