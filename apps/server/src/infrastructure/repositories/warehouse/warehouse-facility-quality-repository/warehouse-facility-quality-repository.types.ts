export type WarehouseFacilityQualityWindowName =
	| "last_week"
	| "previous_week"
	| "last_28_days"
	| "previous_28_days";

export interface WarehouseFacilityQualityWindow {
	name: WarehouseFacilityQualityWindowName;
	days: number;
	windowsAgo: number;
}

export type WarehouseFacilityQualityCount =
	| "played_games"
	| "roster_games"
	| "roster_players"
	| "waitlist_games"
	| "rostered_cancelled_games"
	| "almost_filled_games"
	| "incident_games"
	| "rating_count"
	| "rating_total"
	| "players"
	| "returning_players";

export interface WarehouseFacilityLowReviewRow {
	id: string | number;
	rate: string | number;
	date: string;
	title: string | null;
}

export type WarehouseFacilityQualityRow = Record<
	`${WarehouseFacilityQualityCount}_${WarehouseFacilityQualityWindowName}`,
	string | number | null
> & { low_reviews: WarehouseFacilityLowReviewRow[] | null };
