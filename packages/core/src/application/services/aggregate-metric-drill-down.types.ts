import type {
	DrillDownMeasure,
	DrillDownSegment,
	DrillDownSlice,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import type { GameDepartment, GameDepartmentCounts } from "@core/domain";

export interface DrillDownOrganizerFact {
	id: string;
	name: string;
	games?: number | null;
	scheduled?: number | null;
	uniquePlayerIds?: readonly string[];
	activatedPlayerIds?: readonly string[];
	almostFilled?: number | null;
	rosteredCanceled?: number | null;
	missingRoster?: number;
	incidentGames?: number | null;
}

export interface DrillDownFacilityFact {
	id: string;
	name: string;
	marketId: string;
	marketName: string;
	games: number | null;
	gamesByDepartment: GameDepartmentCounts | null;
	organizers?: readonly DrillDownOrganizerFact[] | null;
	scheduled?: number | null;
	scheduledByDepartment?: GameDepartmentCounts | null;
	uniquePlayerIds?: readonly string[];
	uniquePlayerIdsByDepartment?: Partial<Record<GameDepartment, readonly string[]>> | null;
	activatedPlayerIds?: readonly string[];
	activatedPlayerIdsByDepartment?: Partial<Record<GameDepartment, readonly string[]>> | null;
	activeOrganizerIds?: readonly string[];
	almostFilled?: number | null;
	almostFilledByDepartment?: GameDepartmentCounts | null;
	rosteredCanceled?: number | null;
	rosteredCanceledByDepartment?: GameDepartmentCounts | null;
	missingRoster?: number;
	missingRosterByDepartment?: GameDepartmentCounts | null;
	incidentGames?: number | null;
	incidentGamesByDepartment?: GameDepartmentCounts | null;
}

export type DrillDownRateMeasure = Extract<
	DrillDownMeasure,
	"confirmation-rate" | "almost-filled-rate" | "incident-games-rate"
>;

export interface RateFactParts {
	numerator: number | null;
	denominator: number | null;
	numeratorByDepartment: GameDepartmentCounts | null;
	denominatorByDepartment: GameDepartmentCounts | null;
	dataErrors?: number;
	dataErrorsByDepartment?: GameDepartmentCounts | null;
}

export interface AggregateCountDrillDownInput {
	facilities: readonly DrillDownFacilityFact[];
	measure: DrillDownMeasure;
	slice: DrillDownSlice;
	segment?: DrillDownSegment;
	marketId?: string;
	facilityId?: string;
	department?: GameDepartment;
	gameDepartments?: readonly GameDepartment[];
	start: string;
	end: string;
	range: MetricDrillDownView["range"];
}

export interface DrillDownContributionFacility {
	id: string;
	name: string;
}

export interface DistinctCountContribution {
	id: string;
	name: string;
	memberKeys: readonly string[];
	facility?: DrillDownContributionFacility;
	facilityIds?: readonly string[];
	departments?: Partial<Record<GameDepartment, readonly string[]>> | null;
	organizers?:
		| readonly {
				id: string;
				name: string;
				memberKeys: readonly string[];
				facilityIds?: readonly string[];
		  }[]
		| null;
}

export interface RateContribution {
	id: string;
	name: string;
	numerator: number | null;
	denominator: number | null;
	dataErrors?: number;
	facility?: DrillDownContributionFacility;
	facilityIds?: readonly string[];
	departments?: Partial<
		Record<GameDepartment, { numerator: number | null; denominator: number | null }>
	> | null;
	organizers?:
		| readonly {
				id: string;
				name: string;
				numerator: number | null;
				denominator: number | null;
				dataErrors?: number;
				facilityIds?: readonly string[];
		  }[]
		| null;
}

export type { MetricDrillDownRow };
