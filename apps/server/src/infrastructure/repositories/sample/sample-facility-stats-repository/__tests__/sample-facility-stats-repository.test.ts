import { FixedClock } from "@market-health-map/core/application/testing";
import {
	lastWeekStart,
	SampleFacilityStatsRepository,
} from "@server/infrastructure/repositories/sample/sample-facility-stats-repository/sample-facility-stats-repository";

const repository = new SampleFacilityStatsRepository(
	new FixedClock(new Date("2026-09-29T12:00:00Z")),
);

describe("SampleFacilityStatsRepository", () => {
	it("produces consistent, deterministic weekly counts", async () => {
		const ids = ["austin-facility-1" as never];
		const first = await repository.getReservationStats(ids);
		const second = await repository.getReservationStats(ids);
		const firstPlayers = await repository.getPlayerStats(ids);
		const secondPlayers = await repository.getPlayerStats(ids);

		expect(second).toEqual(first);
		expect(secondPlayers).toEqual(firstPlayers);
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
