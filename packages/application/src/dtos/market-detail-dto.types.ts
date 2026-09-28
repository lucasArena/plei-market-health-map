import type { getMarketDetailSchema } from "@application/dtos/market-detail-dto";
import type { MarketHealthView } from "@application/dtos/market-dto.types";
import type { FacilityMetrics } from "@market-health-map/domain";
import type { z } from "zod";

export type GetMarketDetailInput = z.infer<typeof getMarketDetailSchema>;

export interface FacilityView {
	id: string;
	marketId: string;
	name: string;
	address: string;
	avatarUrl: string | null;
	metrics: FacilityMetrics;
}

export interface MarketDetailView {
	market: MarketHealthView;
	facilities: FacilityView[];
}
