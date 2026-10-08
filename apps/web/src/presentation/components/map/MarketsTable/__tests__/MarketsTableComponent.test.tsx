import type {
	MarketGameChangeView,
	MarketSummaryMarketRankView,
} from "@market-health-map/core/application";
import { fireEvent, screen, within } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MarketsTable } from "@/presentation/components/map/MarketsTable/MarketsTableComponent";
import {
	buildMarketRows,
	formatChange,
	sortMarketRows,
} from "@/presentation/components/map/MarketsTable/MarketsTableComponent.rules";

const mockSetMapNavigation = vi.fn();

vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({ setMapNavigation: mockSetMapNavigation }),
}));

function market(id: string, games: number, active = 2, total = 3): MarketSummaryMarketRankView {
	return { id, name: `${id} Metro`, facilityCount: total, activeFacilityCount: active, games };
}

function change(id: string, played: number, playedPrevious: number): MarketGameChangeView {
	return {
		id,
		name: `${id} Metro`,
		played,
		playedPrevious,
		change: played - playedPrevious,
		changePercent: playedPrevious > 0 ? ((played - playedPrevious) / playedPrevious) * 100 : null,
		facilities: [],
	};
}

const MARKETS = [
	market("Miami", 48, 12, 14),
	market("Austin", 14, 3, 4),
	market("Chicago", 15, 4, 5),
];
const CHANGES = [change("Miami", 48, 60), change("Austin", 14, 9), change("Chicago", 15, 18)];
const messages = EN_MESSAGES.marketsTable;

function rowNames() {
	return screen
		.getAllByRole("button", { name: /^Open / })
		.map((row) => row.getAttribute("aria-label"));
}

describe("MarketsTable rules", () => {
	const percent = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

	it("labels drops, gains, flat periods and markets without a baseline", () => {
		expect(formatChange(change("a", 48, 60), messages, percent)).toEqual({
			label: "−20%",
			direction: "down",
		});
		expect(formatChange(change("a", 21, 14), messages, percent)).toEqual({
			label: "+50%",
			direction: "up",
		});
		expect(formatChange(change("a", 10, 10), messages, percent)).toEqual({
			label: "0%",
			direction: "flat",
		});
		expect(formatChange(change("a", 4, 0), messages, percent)).toEqual({
			label: "New",
			direction: "up",
		});
		expect(formatChange(change("a", 0, 0), messages, percent)).toBeNull();
	});

	it("leaves the status pending until the period comparison loads", () => {
		const [row] = buildMarketRows([market("Miami", 48, 12, 14)], undefined, messages, "en");

		expect(row).toMatchObject({
			status: null,
			statusLabel: null,
			change: null,
			activeLabel: "12 of 14 active",
			gamesLabel: "48",
		});
	});

	it("sorts by status, games or the biggest drop", () => {
		const rows = buildMarketRows([...MARKETS, market("Denver", 8, 3, 6)], CHANGES, messages, "en");

		expect(sortMarketRows(rows, "status").map((row) => row.id)).toEqual([
			"Miami",
			"Chicago",
			"Austin",
			"Denver",
		]);
		expect(sortMarketRows(rows, "games").map((row) => row.id)).toEqual([
			"Miami",
			"Chicago",
			"Austin",
			"Denver",
		]);
		expect(sortMarketRows(rows, "change").map((row) => row.id)).toEqual([
			"Miami",
			"Chicago",
			"Austin",
			"Denver",
		]);
		expect(sortMarketRows(rows.slice(1), "games").map((row) => row.id)).toEqual([
			"Chicago",
			"Austin",
			"Denver",
		]);
	});
});

describe("MarketsTable", () => {
	beforeEach(() => mockSetMapNavigation.mockClear());

	it("lists markets by status with their activity, games and change", () => {
		renderWithMessages(<MarketsTable markets={MARKETS} changes={CHANGES} />);

		expect(rowNames()).toEqual(["Open Miami Metro", "Open Chicago Metro", "Open Austin Metro"]);
		const miami = screen.getByRole("button", { name: "Open Miami Metro" });
		expect(within(miami).getByText(/^Attention/)).toHaveClass("font-semibold");
		expect(miami).toHaveTextContent("Attention · 12 of 14 active");
		expect(miami).toHaveTextContent("48");
		expect(miami).toHaveTextContent("−20%");
		expect(screen.getByRole("button", { name: "Open Chicago Metro" })).toHaveTextContent(
			"Watch · 4 of 5 active",
		);
		expect(screen.getByRole("button", { name: "Open Austin Metro" })).toHaveTextContent(
			"On track · 3 of 4 active",
		);
		expect(screen.getByRole("button", { name: "Status" })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByText(messages.noteStatus)).toBeInTheDocument();
	});

	it("re-sorts by games and change and explains the order", () => {
		renderWithMessages(<MarketsTable markets={MARKETS} changes={CHANGES} />);

		fireEvent.click(screen.getByRole("button", { name: "Games" }));
		expect(screen.getByRole("button", { name: "Games" })).toHaveAttribute("aria-pressed", "true");
		expect(rowNames()).toEqual(["Open Miami Metro", "Open Chicago Metro", "Open Austin Metro"]);
		expect(screen.getByText(messages.noteGames)).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Change" }));
		expect(rowNames()).toEqual(["Open Miami Metro", "Open Chicago Metro", "Open Austin Metro"]);
		expect(screen.getByText(messages.noteChange)).toBeInTheDocument();
	});

	it("opens a market on the map when its row is selected", () => {
		renderWithMessages(<MarketsTable markets={MARKETS} changes={CHANGES} />);

		fireEvent.click(screen.getByRole("button", { name: "Open Austin Metro" }));

		expect(mockSetMapNavigation).toHaveBeenCalledWith({
			kind: "market",
			id: "Austin",
			name: "Austin Metro",
		});
	});

	it("shows the first 8 markets until Show all is pressed", () => {
		const many = Array.from({ length: 10 }, (_, index) => market(`M${index}`, 20 - index));
		renderWithMessages(<MarketsTable markets={many} changes={undefined} />);

		expect(rowNames()).toHaveLength(8);
		fireEvent.click(screen.getByRole("button", { name: "Show all 10 markets" }));
		expect(rowNames()).toHaveLength(10);
		fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
		expect(rowNames()).toHaveLength(8);
	});

	it("has no Show all button for 8 markets or fewer", () => {
		renderWithMessages(<MarketsTable markets={MARKETS} changes={CHANGES} />);

		expect(screen.queryByRole("button", { name: /Show all/ })).not.toBeInTheDocument();
	});
});
