import { STATS_PERIODS, type StatsPeriod } from "@market-health-map/core/application";
import type { ResolveStorage } from "@/infrastructure/cache/local-storage/stats-period/stats-period-preference.types";

export const STATS_PERIOD_KEY = "market-health-map:stats-period";

function browserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function isStatsPeriod(value: string | null | undefined): value is StatsPeriod {
	return STATS_PERIODS.some((period) => period === value);
}

export class StatsPeriodPreference {
	constructor(private readonly resolveStorage: ResolveStorage = browserStorage) {}

	read(): StatsPeriod | null {
		try {
			const value = this.resolveStorage()?.getItem(STATS_PERIOD_KEY);
			return isStatsPeriod(value) ? value : null;
		} catch {
			return null;
		}
	}

	remember(period: StatsPeriod): void {
		try {
			this.resolveStorage()?.setItem(STATS_PERIOD_KEY, period);
		} catch {
			return;
		}
	}
}

export const statsPeriodPreference = new StatsPeriodPreference();
