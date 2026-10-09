import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";
import type { getMarketAudienceSchema } from "@core/application/dtos/market-audience-dto";
import type { z } from "zod";

export type GetMarketAudienceInput = z.input<typeof getMarketAudienceSchema>;

export interface AudiencePeriodView {
	activeUsers: number;
	activeUsersPrevious: number;
	activeUsersChangePercent: number | null;
	registrations: number;
	registrationsPrevious: number;
	registrationsChangePercent: number | null;
}

export interface MarketAudienceView {
	periods: Record<StatsPeriod, AudiencePeriodView>;
}
