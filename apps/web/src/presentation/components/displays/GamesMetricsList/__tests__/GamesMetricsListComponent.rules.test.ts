import { toReservationPeriodView } from "@market-health-map/core/application";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	buildGamesAxis,
	buildGamesCardView,
	buildGamesChart,
	buildGamesMetricChange,
	buildGamesMetricRows,
	buildPlayersAxis,
	buildUsersCardView,
	tooltipAlignment,
	tooltipPlacement,
	xLabelAlignment,
} from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.rules";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";

const messages = EN_MESSAGES.marketSummary;
const detailMessages = EN_MESSAGES.facilityDetail;
const formatters = createDetailFormatters("en");
// Cancellations set so the rates read like real ones (the shared fixture repeats the same counts).
const STATS = {
	...FACILITY_DETAIL.stats,
	cancelledPreviousWeek: 30,
	cancelledLast28Days: 38,
	cancelledPrevious28Days: 40,
};
const MONTH = EN_MESSAGES.statsPeriods.month;
const WEEK = EN_MESSAGES.statsPeriods.week;

describe("buildGamesMetricChange", () => {
	it("turns a fall in a higher-is-better metric into a red, signed pill", () => {
		expect(buildGamesMetricChange(-20, "percent", true, messages, formatters)).toEqual({
			direction: "down",
			tone: "worse",
			label: "\u221220%",
			description: "Worsened \u221220%",
		});
	});

	it("marks a cancellation increase as worse even though the value rose", () => {
		expect(buildGamesMetricChange(5, "points", false, messages, formatters)).toEqual({
			direction: "up",
			tone: "worse",
			label: "+5 pts",
			description: "Worsened +5 pts",
		});
	});

	it("marks a rise in a higher-is-better metric as better", () => {
		expect(buildGamesMetricChange(4.6, "points", true, messages, formatters)).toMatchObject({
			direction: "up",
			tone: "better",
			label: "+4.6 pts",
		});
	});

	it("shows a flat pill when the rounded change is zero, and nothing without a baseline", () => {
		expect(buildGamesMetricChange(0.4, "percent", true, messages, formatters)).toEqual({
			direction: "flat",
			tone: "flat",
			label: "0%",
			description: messages.gamesChangeSame,
		});
		expect(buildGamesMetricChange(null, "percent", true, messages, formatters)).toBeNull();
	});
});

describe("buildGamesMetricRows", () => {
	it("lists confirmation, cancellation and posted for the 28-day period, each with a comparison", () => {
		const rows = buildGamesMetricRows(
			toReservationPeriodView(STATS, "month"),
			messages,
			detailMessages,
			formatters,
		);
		expect(rows.map((row) => [row.label, row.value, row.previousLabel])).toEqual([
			["Confirmation rate", "84.8%", "vs 83.3%"],
			["Cancellation rate", "15.2%", "vs 16.7%"],
			["Games posted", "250", "vs 240"],
		]);
		// 38 of 250 cancelled vs 40 of 240: a 1.5-point drop is better.
		expect(rows[1]?.change).toMatchObject({ direction: "down", tone: "better" });
	});

	it("compares the 7-day cancellation rate with the previous 7 days; a rise is worse", () => {
		const rows = buildGamesMetricRows(
			toReservationPeriodView(STATS, "week"),
			messages,
			detailMessages,
			formatters,
		);
		expect(rows.map((row) => row.key)).toEqual(["confirmation", "cancellation", "posted"]);
		expect(rows[1]).toMatchObject({
			key: "cancellation",
			label: "Cancellation rate",
			value: "36.8%",
			previousLabel: "vs 34.5%",
			change: { direction: "up", tone: "worse" },
		});
	});

	it("leaves out rows the data cannot support", () => {
		const empty = { ...STATS, scheduledLast28Days: 0, scheduledPrevious28Days: 0 };
		const rows = buildGamesMetricRows(
			toReservationPeriodView(empty, "month"),
			messages,
			detailMessages,
			formatters,
		);
		expect(rows.map((row) => row.key)).toEqual(["posted"]);
		expect(rows[0]?.change).toBeNull();
	});
});

describe("buildGamesCardView", () => {
	it("leads with games played and compares it with the previous period", () => {
		const view = buildGamesCardView(
			toReservationPeriodView(STATS, "month"),
			STATS,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(view.title).toBe("Games in the last 28 days");
		expect(view.hero).toEqual({
			value: "212",
			comparison: "vs 200 in the previous 28 days",
			change: { direction: "up", tone: "better", label: "+6%", description: "Improved +6%" },
		});
		expect(view.axisMax).toBe(60);
		expect(view.ticks.map((tick) => tick.value)).toEqual([0, 30, 60]);
		expect(view.ticks.map((tick) => tick.label)).toEqual(["0", "30", "60"]);
		expect(
			view.series.map((point) => [point.label, point.valueLabel, point.tooltipDetail]),
		).toEqual([
			["Aug 31", "48", "games \u00b7 Aug 31"],
			["Sep 7", "58", "games \u00b7 Sep 7"],
			["Sep 14", "51", "games \u00b7 Sep 14"],
			["Sep 21", "55", "games \u00b7 Sep 21"],
		]);
	});

	it("charts the same four weeks in the 7-day view, ignoring the daily series", () => {
		const week = buildGamesCardView(
			toReservationPeriodView(STATS, "week"),
			STATS,
			"week",
			messages,
			detailMessages,
			WEEK,
			formatters,
		);
		const month = buildGamesCardView(
			toReservationPeriodView(STATS, "month"),
			STATS,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(week.title).toBe("Games in the last 7 days");
		expect(week.hero.comparison).toBe("vs 51 in the previous 7 days");
		expect(week.series).toEqual(month.series);
		expect(week.series.map((point) => point.label)).toEqual([
			"Aug 31",
			"Sep 7",
			"Sep 14",
			"Sep 21",
		]);
		expect(week.ticks).toEqual(month.ticks);
	});

	it("uses the singular unit for a single game", () => {
		const view = buildGamesCardView(
			toReservationPeriodView(STATS, "month"),
			{ ...STATS, weeklyActivity: [{ weekStart: "2026-09-21", gamesPlayed: 1 }] },
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(view.series[0]?.tooltipDetail).toBe("game \u00b7 Sep 21");
	});
});

describe("buildGamesChart", () => {
	it("spreads the weeks edge to edge with a gradient area down to 0", () => {
		const chart = buildGamesChart(
			[{ value: 1000 }, { value: 500 }, { value: 1750 }, { value: 0 }],
			2000,
		);
		expect(chart.points).toEqual([
			{ xPercent: 0, yPercent: 50, topPercent: 50 },
			{ xPercent: 33.33, yPercent: 25, topPercent: 75 },
			{ xPercent: 66.67, yPercent: 87.5, topPercent: 12.5 },
			{ xPercent: 100, yPercent: 0, topPercent: 100 },
		]);
		expect(chart.linePoints).toBe("0,50 33.33,75 66.67,12.5 100,100");
		expect(chart.areaPoints).toBe("0,50 33.33,75 66.67,12.5 100,100 100,100 0,100");
	});

	it("centers a single week and draws no area", () => {
		const single = buildGamesChart([{ value: 3 }], 2000);
		expect(single.points[0]?.xPercent).toBe(50);
		expect(single.areaPoints).toBe("");
	});

	it("flips the tooltip below dots in the upper half of the short plot", () => {
		expect(tooltipPlacement(0)).toBe("bottom-full mb-3");
		expect(tooltipPlacement(50)).toBe("bottom-full mb-3");
		expect(tooltipPlacement(50.01)).toBe("top-full mt-3");
		expect(tooltipPlacement(100)).toBe("top-full mt-3");
	});

	it("keeps the first and last week labels inside the chart", () => {
		expect(xLabelAlignment(0, 4)).toBe("-translate-x-[10px]");
		expect(xLabelAlignment(3, 4)).toBe("-translate-x-[calc(100%-10px)]");
		expect(xLabelAlignment(1, 4)).toBe("-translate-x-1/2");
		expect(xLabelAlignment(0, 1)).toBe("-translate-x-1/2");
	});
});

describe("weekly tooltip data", () => {
	it("gives each week its range, games and change vs the previous week", () => {
		const view = buildGamesCardView(
			toReservationPeriodView(STATS, "month"),
			STATS,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(
			view.series.map((point) => [point.rangeLabel, point.gamesLabel, point.change?.label ?? null]),
		).toEqual([
			["Aug 31 \u2013 Sep 6", "48 games", null],
			["Sep 7 \u2013 Sep 13", "58 games", "+21%"],
			["Sep 14 \u2013 Sep 20", "51 games", "\u221212%"],
			["Sep 21 \u2013 Sep 27", "55 games", "+8%"],
		]);
		expect(view.series[2]?.change).toMatchObject({ direction: "down", tone: "worse" });
		expect(view.series[1]?.summary).toBe(
			"Week of Sep 7 \u2013 Sep 13: 58 games. Improved +21% vs previous week",
		);
		expect(view.series[0]?.summary).toBe(
			"Week of Aug 31 \u2013 Sep 6: 48 games. No previous week to compare",
		);
	});
});

describe("buildGamesAxis", () => {
	it("fits a round top to the largest week so a facility's line is not flattened", () => {
		expect(buildGamesAxis(0)).toEqual({ max: 10, ticks: [0, 5, 10] });
		expect(buildGamesAxis(58)).toEqual({ max: 60, ticks: [0, 30, 60] });
		expect(buildGamesAxis(75)).toEqual({ max: 80, ticks: [0, 40, 80] });
		expect(buildGamesAxis(362)).toEqual({ max: 400, ticks: [0, 200, 400] });
		expect(buildGamesAxis(1337)).toEqual({ max: 2000, ticks: [0, 1000, 2000] });
		expect(buildGamesAxis(3600)).toEqual({ max: 4000, ticks: [0, 2000, 4000] });
	});

	it("formats ticks with the locale's thousands separator", () => {
		const view = buildGamesCardView(
			toReservationPeriodView(STATS, "month"),
			STATS,
			"month",
			messages,
			detailMessages,
			MONTH,
			createDetailFormatters("es"),
		);
		expect(view.ticks.at(-1)?.label).toBe(new Intl.NumberFormat("es").format(view.axisMax));
	});
});

describe("tooltipAlignment", () => {
	it("keeps edge tooltips inside the chart, like the drill-down", () => {
		expect(tooltipAlignment(0, 4)).toBe("left-0");
		expect(tooltipAlignment(3, 4)).toBe("right-0");
		expect(tooltipAlignment(1, 4)).toBe("left-1/2 -translate-x-1/2");
	});
});

describe("buildPlayersAxis", () => {
	it("picks a round top that fits the largest week, as 3 even lines", () => {
		expect(buildPlayersAxis(0)).toEqual({ max: 10, ticks: [0, 5, 10] });
		expect(buildPlayersAxis(8)).toEqual({ max: 10, ticks: [0, 5, 10] });
		expect(buildPlayersAxis(37)).toEqual({ max: 40, ticks: [0, 20, 40] });
		expect(buildPlayersAxis(100)).toEqual({ max: 100, ticks: [0, 50, 100] });
		expect(buildPlayersAxis(1234)).toEqual({ max: 2000, ticks: [0, 1000, 2000] });
	});
});

describe("buildUsersCardView", () => {
	const players = {
		uniquePlayers: 1200,
		uniquePlayersPrevious: 1000,
		uniquePlayersChangePercent: 20,
		activatedPlayers: 90,
		activatedPlayersPrevious: 100,
		activatedPlayersChangePercent: -10,
	};
	const weekly = {
		weeklyActivatedPlayers: [
			{ weekStart: "2026-09-03", players: 20 },
			{ weekStart: "2026-09-10", players: 25 },
			{ weekStart: "2026-09-17", players: 20 },
			{ weekStart: "2026-09-24", players: 30 },
		],
	};
	const audience = {
		period: {
			activeUsers: 12000,
			activeUsersPrevious: 10000,
			activeUsersChangePercent: 20,
			registrations: 450,
			registrationsPrevious: 500,
			registrationsChangePercent: -10,
		},
		isPending: false,
	};

	it("uses activated players as the Active players hero, with comparison and pill", () => {
		const view = buildUsersCardView(players, weekly, audience, messages, MONTH, formatters);
		expect(view.title).toBe("Active players");
		expect(view.hero.value).toBe("90");
		expect(view.hero.comparison).toContain("100");
		expect(view.hero.change).toMatchObject({
			direction: "down",
			tone: "worse",
			label: "\u221210%",
		});
	});

	it("charts the weekly activated players on its own round scale", () => {
		const view = buildUsersCardView(players, weekly, audience, messages, MONTH, formatters);
		expect(view.series.map((point) => point.value)).toEqual([20, 25, 20, 30]);
		expect(view.series[3]).toMatchObject({
			gamesLabel: "30 active players",
			tooltipDetail: "active players · Sep 24",
		});
		expect(view.series[3]?.change).toMatchObject({ direction: "up", label: "+50%" });
		expect(view.axisMax).toBe(40);
		expect(view.ticks.map((tick) => tick.label)).toEqual(["0", "20", "40"]);
	});

	it("lists New registrations, Active users and Unique users with value, previous and pill", () => {
		const view = buildUsersCardView(players, weekly, audience, messages, MONTH, formatters);
		expect(view.rows.map((row) => row.key)).toEqual([
			"registrations",
			"activeUsers",
			"uniqueUsers",
		]);
		expect(view.rows[0]).toMatchObject({
			label: "New registrations",
			value: "450",
			previousLabel: "vs 500",
		});
		expect(view.rows[0]?.change).toMatchObject({ direction: "down", tone: "worse" });
		expect(view.rows[1]).toMatchObject({ label: "Active users", value: "12,000" });
		expect(view.rows[1]?.change).toMatchObject({ direction: "up", tone: "better", label: "+20%" });
		expect(view.rows[2]).toMatchObject({
			label: "Unique users",
			value: "1,200",
			previousLabel: "vs 1,000",
		});
	});

	it("shows placeholder audience rows while loading, and drops them when unavailable", () => {
		const pending = buildUsersCardView(
			players,
			weekly,
			{ period: null, isPending: true },
			messages,
			MONTH,
			formatters,
		);
		expect(pending.rows.map((row) => [row.key, row.isPending ?? false])).toEqual([
			["registrations", true],
			["activeUsers", true],
			["uniqueUsers", false],
		]);
		expect(pending.rows[0]?.pendingLabel).toBe("Loading New registrations…");
		const failed = buildUsersCardView(
			players,
			weekly,
			{ period: null, isPending: false },
			messages,
			MONTH,
			formatters,
		);
		expect(failed.rows.map((row) => row.key)).toEqual(["uniqueUsers"]);
		const facility = buildUsersCardView(players, weekly, null, messages, MONTH, formatters);
		expect(facility.rows.map((row) => row.key)).toEqual(["uniqueUsers"]);
	});

	it("hides pills when there is no previous value, and the chart without weeks", () => {
		const view = buildUsersCardView(
			{ ...players, activatedPlayersChangePercent: null },
			{ weeklyActivatedPlayers: [] },
			{ ...audience, period: { ...audience.period, registrationsChangePercent: null } },
			messages,
			MONTH,
			formatters,
		);
		expect(view.hero.change).toBeNull();
		expect(view.rows[0]?.change).toBeNull();
		expect(view.series).toEqual([]);
	});
});
