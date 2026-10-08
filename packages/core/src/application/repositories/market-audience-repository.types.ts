import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";

export interface MarketAudiencePeriodCounts {
	activeUsers: number;
	activeUsersPrevious: number;
	registrations: number;
	registrationsPrevious: number;
}

export type MarketAudienceCounts = Record<StatsPeriod, MarketAudiencePeriodCounts>;

export interface MarketAudienceRepository {
	getAudience(marketId: string | null, today: string): Promise<MarketAudienceCounts>;
}
