import type { DailyActivity } from "@core/application/dtos/app-metrics-dto.types";
import { makeGetAppMetrics } from "@core/application/services/get-app-metrics";
import { makeListAppMetricsPeople } from "@core/application/services/list-app-metrics-people";
import { makeRecordDailyActivity } from "@core/application/services/record-daily-activity";
import { InMemoryDailyActivityRepository } from "@core/application/testing/in-memory-daily-activity-repository";

const NOW = new Date("2026-09-30T15:00:00Z");
const clock = { now: () => NOW };
const TARGETS = ["Stefano@plei.com", "alan@plei.com", "blake@plei.com", "mili@plei.com"];
const COUNTERS = {
	facilitiesOpened: 0,
	marketSummariesOpened: 0,
	searches: 0,
	aiSummaries: 0,
	feedbackSent: 0,
};

function row(email: string, day: string, overrides: Partial<DailyActivity> = {}): DailyActivity {
	return {
		userId: email,
		email,
		name: null,
		day,
		firstSeenAt: new Date(`${day}T14:00:00Z`),
		lastSeenAt: new Date(`${day}T15:00:00Z`),
		minutesActive: 10,
		visits: 1,
		counters: { ...COUNTERS },
		...overrides,
	};
}

describe("recordDailyActivity", () => {
	it("keeps one row per person per US Eastern day and adds up each report", async () => {
		const dailyActivity = new InMemoryDailyActivityRepository();
		const record = makeRecordDailyActivity({ dailyActivity, clock });
		const user = { userId: "g-1", email: "Stefano@plei.com", name: "Stefano Sanchez" };

		await record({ user, report: { visits: 1 } });
		await record({ user, report: { minutes: 12, counters: { facilitiesOpened: 3 } } });

		const [saved] = await dailyActivity.listBetween("2026-09-30", "2026-09-30");
		expect(dailyActivity.rows.size).toBe(1);
		expect(saved).toMatchObject({
			email: "stefano@plei.com",
			name: "Stefano Sanchez",
			day: "2026-09-30",
			visits: 1,
			minutesActive: 12,
			counters: { facilitiesOpened: 3, searches: 0 },
		});
	});

	it("deletes rows older than 180 days once a day", async () => {
		const dailyActivity = new InMemoryDailyActivityRepository([
			row("old@plei.com", "2026-03-01"),
			row("recent@plei.com", "2026-09-01"),
		]);
		const deleteBefore = vi.spyOn(dailyActivity, "deleteBefore");
		const record = makeRecordDailyActivity({ dailyActivity, clock });
		const user = { userId: "g-1", email: "a@plei.com" };

		await record({ user, report: {} });
		await record({ user, report: {} });

		expect(deleteBefore).toHaveBeenCalledTimes(1);
		expect(deleteBefore).toHaveBeenCalledWith("2026-04-03");
		expect([...dailyActivity.rows.values()].map((saved) => saved.email)).not.toContain(
			"old@plei.com",
		);
	});

	it("rejects invalid reports", async () => {
		const record = makeRecordDailyActivity({
			dailyActivity: new InMemoryDailyActivityRepository(),
			clock,
		});

		await expect(
			record({ user: { userId: "g-1", email: "a@plei.com" }, report: { minutes: -1 } }),
		).rejects.toThrow();
	});
});

describe("getAppMetrics", () => {
	it("measures this week's target users against the 75% goal", async () => {
		const dailyActivity = new InMemoryDailyActivityRepository([
			row("stefano@plei.com", "2026-09-28"),
			row("alan@plei.com", "2026-09-29"),
			row("blake@plei.com", "2026-09-30"),
			row("someone@plei.com", "2026-09-30"),
			row("mili@plei.com", "2026-09-21"),
		]);
		const getAppMetrics = makeGetAppMetrics({ dailyActivity, clock, targetEmails: TARGETS });

		const metrics = await getAppMetrics();

		expect(metrics).toMatchObject({
			weekStart: "2026-09-28",
			weekEnd: "2026-10-04",
			goalPercent: 75,
			targetCount: 4,
			activeTargetCount: 3,
			targetPercent: 75,
			isGoalMet: true,
			activeUserCount: 4,
			inactiveTargets: ["mili@plei.com"],
		});
		expect(metrics.weeks).toHaveLength(8);
		expect(metrics.weeks.at(-2)).toEqual({
			weekStart: "2026-09-21",
			activeTargetCount: 1,
			targetPercent: 25,
			activeUserCount: 1,
		});
		expect(metrics.weeks[0]).toEqual({
			weekStart: "2026-08-10",
			activeTargetCount: 0,
			targetPercent: 0,
			activeUserCount: 0,
		});
	});

	it("never meets the goal without target users", async () => {
		const getAppMetrics = makeGetAppMetrics({
			dailyActivity: new InMemoryDailyActivityRepository([row("a@plei.com", "2026-09-30")]),
			clock,
			targetEmails: [],
		});

		expect(await getAppMetrics()).toMatchObject({
			targetCount: 0,
			targetPercent: 0,
			isGoalMet: false,
			activeUserCount: 1,
		});
	});
});

describe("listAppMetricsPeople", () => {
	const dailyActivity = new InMemoryDailyActivityRepository([
		row("stefano@plei.com", "2026-09-28", {
			name: "Stefano Sanchez",
			minutesActive: 20,
			visits: 2,
			counters: { ...COUNTERS, marketSummariesOpened: 4, facilitiesOpened: 1 },
		}),
		row("stefano@plei.com", "2026-09-30", { minutesActive: 5 }),
		row("guest@plei.com", "2026-09-30", { lastSeenAt: new Date("2026-09-30T18:00:00Z") }),
		row("mili@plei.com", "2026-09-15"),
	]);

	it("lists everyone, target users first, with this week's totals", async () => {
		const listPeople = makeListAppMetricsPeople({ dailyActivity, clock, targetEmails: TARGETS });

		const page = await listPeople({ page: 1, pageSize: 10 });

		expect(page).toMatchObject({ page: 1, pageSize: 10, total: 5, pageCount: 1 });
		expect(page.rows.map((person) => [person.email, person.isTarget])).toEqual([
			["stefano@plei.com", true],
			["mili@plei.com", true],
			["alan@plei.com", true],
			["blake@plei.com", true],
			["guest@plei.com", false],
		]);
		expect(page.rows[0]).toMatchObject({
			name: "Stefano Sanchez",
			daysActive: 2,
			visits: 3,
			minutes: 25,
			topFeature: "marketSummariesOpened",
			lastSeenAt: "2026-09-30T15:00:00.000Z",
		});
		expect(page.rows[1]).toMatchObject({
			daysActive: 0,
			topFeature: null,
			lastSeenAt: "2026-09-15T15:00:00.000Z",
		});
		expect(page.rows[2]).toMatchObject({ daysActive: 0, lastSeenAt: null });
	});

	it("paginates", async () => {
		const listPeople = makeListAppMetricsPeople({ dailyActivity, clock, targetEmails: TARGETS });

		const second = await listPeople({ page: "2", pageSize: "2" });

		expect(second).toMatchObject({ page: 2, pageSize: 2, total: 5, pageCount: 3 });
		expect(second.rows.map((person) => person.email)).toEqual(["alan@plei.com", "blake@plei.com"]);
		expect((await listPeople()).pageSize).toBe(10);
	});
});
