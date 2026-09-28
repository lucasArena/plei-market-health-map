import type { MarketHealthView } from "@application/dtos/market-dto.types";
import { toMarketHealthView } from "@application/mappers/market-mapper";
import type { ListMarketHealthDeps } from "@application/use-cases/list-market-health.types";

export function makeListMarketHealth({ markets }: ListMarketHealthDeps) {
	return async function listMarketHealth(): Promise<MarketHealthView[]> {
		const active = await markets.listActive();
		return active
			.map(toMarketHealthView)
			.sort((a, b) => a.metrics.healthScore - b.metrics.healthScore);
	};
}
