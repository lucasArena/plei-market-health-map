import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import {
	buildInsightChecks,
	directionIn,
	isSupportedLine,
	percentsIn,
	supportedInsightText,
} from "@/infrastructure/ai/insight-check/insight-check";

function checksFor(changes: {
	games: number | null;
	unique: number | null;
	activated: number | null;
	confirmation: number | null;
	insightFacts?: string;
}) {
	return buildInsightChecks({
		kind: "all-markets",
		id: "all",
		name: "All markets",
		insightFacts: changes.insightFacts,
		stats: {
			...FACILITY_DETAIL.stats,
			uniquePlayersLast28Days: 0,
			uniquePlayersPrevious28Days: 0,
			activatedPlayersLast28Days: 0,
			activatedPlayersPrevious28Days: 0,
			playedPeriodChangePercent: changes.games,
			uniquePlayersPeriodChangePercent: changes.unique,
			activatedPlayersPeriodChangePercent: changes.activated,
			confirmationRateChangePoints: changes.confirmation,
		},
	});
}

const ALL_MARKETS = checksFor({
	games: -8.5,
	unique: -9.8,
	activated: -25.3,
	confirmation: 2.2,
	insightFacts:
		"South Florida: games declined, 1,616 → 1,497 games (-7.4%) versus the previous 28 days; contribution to the overall change: -119 games.",
});

describe("percentsIn and directionIn", () => {
	it("reads percentages and points in every language, and the first direction word", () => {
		expect(percentsIn("down 8.5% and up 2.2 percentage points, 6,9 pontos percentuais")).toEqual([
			8.5, 2.2, 6.9,
		]);
		expect(directionIn("Games fell 8.5%, then rose")).toBe("down");
		expect(directionIn("The increase in unique players")).toBe("up");
		expect(directionIn("Games were flat")).toBeNull();
	});
});

describe("isSupportedLine", () => {
	it("keeps lines whose numbers and directions match the data", () => {
		expect(
			isSupportedLine(
				"The overall change in pickup games played is down 8.5% from the previous 28 days.",
				ALL_MARKETS,
			),
		).toBe(true);
		expect(isSupportedLine("The confirmation rate is up 2.2 percentage points.", ALL_MARKETS)).toBe(
			true,
		);
		expect(
			isSupportedLine("Unique players fell 9.8% while activation dropped 25.3%.", ALL_MARKETS),
		).toBe(true);
		expect(isSupportedLine("Overall activity is weakening; investigate why.", ALL_MARKETS)).toBe(
			true,
		);
	});

	it("drops a metric reported in the wrong direction", () => {
		expect(
			isSupportedLine(
				"The increase in unique players is more significant, with a 23070 player count on 2026-09-07 being up 9.8% from the previous 28 days.",
				ALL_MARKETS,
			),
		).toBe(false);
		expect(
			isSupportedLine("The confirmation rate has decreased by 2.2 percentage points.", ALL_MARKETS),
		).toBe(false);
	});

	it("drops numbers that don't exist in the data, and one metric's number on another", () => {
		expect(
			isSupportedLine("Overall games have increased by 9% over the last 28 days.", ALL_MARKETS),
		).toBe(false);
		expect(isSupportedLine("Pickup games fell 9.8% from the previous 28 days.", ALL_MARKETS)).toBe(
			false,
		);
	});

	it("keeps contributor lines that quote their own change", () => {
		expect(
			isSupportedLine("South Florida games declined 7.4%, the largest drop.", ALL_MARKETS),
		).toBe(true);
		expect(isSupportedLine("South Florida lost 7.4%, the largest drop.", ALL_MARKETS)).toBe(true);
		expect(
			isSupportedLine("Newly activated players increased by 7.4% in South Florida.", ALL_MARKETS),
		).toBe(false);
	});

	it("keeps any direction for an unchanged metric, and skips checks without a baseline", () => {
		const flat = checksFor({ games: 0, unique: null, activated: null, confirmation: null });
		expect(isSupportedLine("Games rose 0% versus the previous 28 days.", flat)).toBe(true);
		expect(isSupportedLine("Unique players rose 0%.", flat)).toBe(true);
	});
});

describe("supportedInsightText", () => {
	it("removes only the wrong lines", () => {
		const text = [
			"The overall change in pickup games played is down 8.5% from the previous 28 days.",
			"- The increase in unique players is more significant, up 9.8% from the previous 28 days.",
			"- The confirmation rate is up 2.2 percentage points from the previous 28 days.",
		].join("\n");

		expect(supportedInsightText(text, ALL_MARKETS)).toBe(
			[
				"The overall change in pickup games played is down 8.5% from the previous 28 days.",
				"- The confirmation rate is up 2.2 percentage points from the previous 28 days.",
			].join("\n"),
		);
	});
});
