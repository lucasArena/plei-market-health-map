import {
	STATS_PERIOD_KEY,
	StatsPeriodPreference,
	statsPeriodPreference,
} from "@/infrastructure/cache/local-storage/stats-period/stats-period-preference";

describe("StatsPeriodPreference", () => {
	beforeEach(() => localStorage.clear());

	it("remembers the last chosen period", () => {
		expect(statsPeriodPreference.read()).toBeNull();

		statsPeriodPreference.remember("month");
		expect(localStorage.getItem(STATS_PERIOD_KEY)).toBe("month");
		expect(new StatsPeriodPreference().read()).toBe("month");
	});

	it("ignores unknown values", () => {
		localStorage.setItem(STATS_PERIOD_KEY, "year");

		expect(statsPeriodPreference.read()).toBeNull();
	});

	it("stays quiet when storage is missing or throws", () => {
		const missing = new StatsPeriodPreference(() => null);
		const throwing = new StatsPeriodPreference(() => {
			throw new Error("blocked");
		});

		missing.remember("month");
		throwing.remember("month");
		expect(missing.read()).toBeNull();
		expect(throwing.read()).toBeNull();
	});
});
