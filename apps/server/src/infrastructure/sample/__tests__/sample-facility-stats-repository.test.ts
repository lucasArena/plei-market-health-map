import { FixedClock } from "@market-health-map/core/application/testing";
import {
	lastWeekStart,
	SampleFacilityStatsRepository,
} from "@server/infrastructure/sample/sample-facility-stats-repository";

const repository = new SampleFacilityStatsRepository(
	new FixedClock(new Date("2026-09-29T12:00:00Z")),
);

describe("SampleFacilityStatsRepository", () => {
	it("produces consistent, deterministic weekly counts", async () => {
		const first = await repository.getWeeklyCounts("austin-facility-1" as never);
		const second = await repository.getWeeklyCounts("austin-facility-1" as never);

		expect(second).toEqual(first);
		expect(first.weekStart).toBe("2026-09-21");
		expect(first.lastPlayedDate).toBe("2026-09-28");
		expect(first.playedLastWeek + first.cancelledLastWeek).toBe(first.scheduledLastWeek);
		expect(first.scheduledLastWeek).toBeGreaterThanOrEqual(4);
	});
});

describe("lastWeekStart", () => {
	it("returns the Monday of the previous week", () => {
		expect(lastWeekStart(new Date("2026-09-28T00:00:00Z"))).toBe("2026-09-21");
		expect(lastWeekStart(new Date("2026-10-04T23:00:00Z"))).toBe("2026-09-21");
	});
});
