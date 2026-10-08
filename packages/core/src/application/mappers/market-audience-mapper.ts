import type {
	AudiencePeriodView,
	MarketAudienceView,
} from "@core/application/dtos/market-audience-dto.types";
import { percentChange } from "@core/application/mappers/facility-stats-mapper";
import type {
	MarketAudienceCounts,
	MarketAudiencePeriodCounts,
} from "@core/application/repositories/market-audience-repository.types";

function toAudiencePeriodView(counts: MarketAudiencePeriodCounts): AudiencePeriodView {
	return {
		activeUsers: counts.activeUsers,
		activeUsersPrevious: counts.activeUsersPrevious,
		activeUsersChangePercent: percentChange(counts.activeUsers, counts.activeUsersPrevious),
		registrations: counts.registrations,
		registrationsPrevious: counts.registrationsPrevious,
		registrationsChangePercent: percentChange(counts.registrations, counts.registrationsPrevious),
	};
}

export function toMarketAudienceView(counts: MarketAudienceCounts): MarketAudienceView {
	return {
		periods: {
			week: toAudiencePeriodView(counts.week),
			month: toAudiencePeriodView(counts.month),
		},
	};
}
