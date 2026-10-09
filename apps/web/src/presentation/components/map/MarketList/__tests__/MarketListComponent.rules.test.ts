import { describe, expect, it } from "vitest";
import { sortMarketRows } from "@/presentation/components/map/MarketList/MarketListComponent.rules";
import {
	type MarketListRowView,
	MarketListSort,
} from "@/presentation/components/map/MarketList/MarketListComponent.types";

function row(name: string, games: number): MarketListRowView {
	return {
		key: name,
		id: name,
		name,
		status: "steady",
		statusLabel: "steady",
		detail: "",
		games,
		gamesLabel: String(games),
		changePercent: 0,
		changeDirection: "flat",
		changeLabel: "0%",
		ariaLabel: name,
	};
}

const ROWS = [row("Denver", 20), row("Austin", 50), row("Chicago", 20), row("Boston", 90)];

describe("sortMarketRows", () => {
	it("orders by games descending with name as the tie-break, like the drill-down", () => {
		expect(
			sortMarketRows(ROWS, MarketListSort.games, "desc", "en").map((item) => item.name),
		).toEqual(["Boston", "Austin", "Chicago", "Denver"]);
	});

	it("keeps the name tie-break ascending when games are ascending", () => {
		expect(
			sortMarketRows(ROWS, MarketListSort.games, "asc", "en").map((item) => item.name),
		).toEqual(["Chicago", "Denver", "Austin", "Boston"]);
	});

	it("sorts by name both ways", () => {
		expect(sortMarketRows(ROWS, MarketListSort.name, "asc", "en").map((item) => item.name)).toEqual(
			["Austin", "Boston", "Chicago", "Denver"],
		);
		expect(
			sortMarketRows(ROWS, MarketListSort.name, "desc", "en").map((item) => item.name),
		).toEqual(["Denver", "Chicago", "Boston", "Austin"]);
	});

	it("sorts by vs prev both ways, keeping rows without a comparison last", () => {
		const rows = [
			{ ...row("Austin", 50), changePercent: 10 },
			{ ...row("Boston", 90), changePercent: null },
			{ ...row("Chicago", 20), changePercent: -30 },
			{ ...row("Denver", 20), changePercent: 10 },
		];
		expect(
			sortMarketRows(rows, MarketListSort.change, "desc", "en").map((item) => item.name),
		).toEqual(["Austin", "Denver", "Chicago", "Boston"]);
		expect(
			sortMarketRows(rows, MarketListSort.change, "asc", "en").map((item) => item.name),
		).toEqual(["Chicago", "Austin", "Denver", "Boston"]);
	});
});
