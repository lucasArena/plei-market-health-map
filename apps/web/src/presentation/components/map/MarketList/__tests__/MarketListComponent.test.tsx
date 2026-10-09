import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EN_MESSAGES } from "@/application/test/messages";
import { MODULE_ROW_DIVIDER_CLASS } from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import { MarketList } from "@/presentation/components/map/MarketList/MarketListComponent";
import type {
	MarketListRowView,
	MarketTrendStatus,
} from "@/presentation/components/map/MarketList/MarketListComponent.types";

function row(
	name: string,
	status: MarketTrendStatus,
	changePercent: number,
	games = 10,
): MarketListRowView {
	return {
		key: name,
		id: name,
		name,
		status,
		statusLabel: status,
		detail: "1 of 1 active",
		games,
		gamesLabel: String(games),
		changePercent,
		changeDirection: changePercent < 0 ? "down" : "up",
		changeLabel: `${changePercent}%`,
		ariaLabel: name,
	};
}

const ROWS = [
	row("Austin", "growing", 50, 40),
	row("Boston", "declining", -30, 80),
	row("Chicago", "declining", -20, 40),
	row("Denver", "steady", 0, 5),
	row("El Paso", "growing", 10, 60),
	row("Fresno", "declining", -5, 30),
	row("Gary", "growing", 90, 20),
	row("Houston", "steady", 0, 90),
];

const HERO = { value: "8", comparison: "4 inactive", change: null };

function renderList(rows = ROWS) {
	render(
		<MarketList
			rows={rows}
			emptyLabel="None"
			seeAllLabel={`See all ${rows.length} markets`}
			messages={EN_MESSAGES.marketSummary}
			hero={HERO}
			onSelect={vi.fn()}
		/>,
	);
}

describe("MarketList", () => {
	it("lists markets by games, descending like the drill-down, and expands past the first 5", () => {
		renderList();
		// No worst 3 / best 3 groups any more.
		expect(screen.queryByRole("heading", { name: "Needs attention" })).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Doing best" })).not.toBeInTheDocument();
		const names = () =>
			screen
				.getAllByRole("listitem")
				.map((item) => item.querySelector("button")?.getAttribute("aria-label"));
		// Ties (Austin/Chicago at 40) break by name.
		expect(names()).toEqual(["Houston", "Boston", "El Paso", "Austin", "Chicago"]);

		const cta = screen.getByRole("button", { name: "See all 8 markets" });
		expect(cta).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(cta);
		expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		expect(names().slice(-2)).toEqual(["Gary", "Denver"]);

		fireEvent.click(screen.getByRole("button", { name: "Show less" }));
		expect(screen.queryByRole("button", { name: "Denver" })).not.toBeInTheDocument();
	});

	it("sorts from the column headers like the drill-down, with no Status/Change control", () => {
		renderList();
		const header = screen.getByRole("group", { name: "Sort markets by" });
		expect(within(header).queryByRole("button", { name: /Status/ })).not.toBeInTheDocument();
		expect(within(header).queryByRole("button", { name: /^Change/ })).not.toBeInTheDocument();
		const games = within(header).getByRole("button", { name: /Games/ });
		expect(games).toHaveAttribute("aria-pressed", "true");
		expect(games).toHaveTextContent("Games");
		expect(games).not.toHaveTextContent("↕");
		// Staging's sort chevron: shown at 80% on the active column, hidden elsewhere until hover.
		expect(within(games).getByTestId("sort-icon")).toHaveClass("size-3", "opacity-80");
		expect(within(header).getByRole("button", { name: /Market/ })).toHaveClass("group");

		fireEvent.click(within(header).getByRole("button", { name: /Market/ }));
		expect(screen.getAllByRole("listitem")[0]?.querySelector("button")).toHaveAttribute(
			"aria-label",
			"Austin",
		);
		fireEvent.click(games);
		fireEvent.click(games);
		expect(screen.getAllByRole("listitem")[0]?.querySelector("button")).toHaveAttribute(
			"aria-label",
			"Denver",
		);
	});

	it("replaces the Markets title with a Games-style Active markets header", () => {
		renderList();
		expect(screen.queryByRole("heading", { name: "Markets" })).not.toBeInTheDocument();
		const title = screen.getByRole("heading", { level: 3, name: "Active markets" });
		expect(title).toHaveClass("text-[11px]", "font-normal", "text-[#525866]", "leading-[13px]");
		expect(screen.getByRole("region", { name: "Active markets" })).toHaveClass(
			"rounded-[10px]",
			"border",
			"border-foreground/[0.06]",
			"bg-foreground/[0.03]",
			"p-[12px]",
		);
		const hero = screen.getByTestId("markets-hero");
		expect(within(hero).getByText("8")).toHaveClass("text-3xl", "font-semibold");
		// No previous-period comparison: no pill or dash, just the inactive count in 11px #525866.
		expect(hero.querySelector("[data-tone]")).toBeNull();
		expect(hero).not.toHaveTextContent("\u2014");
		expect(within(hero).queryByText("No previous period to compare")).not.toBeInTheDocument();
		const comparison = screen.getByTestId("markets-hero-comparison");
		expect(comparison).toHaveTextContent(/^4 inactive$/);
		expect(comparison).toHaveClass("text-[11px]", "text-[#525866]");
		// The table stays inside the same container.
		expect(screen.getByRole("region", { name: "Active markets" })).toContainElement(
			screen.getByTestId("market-list-header"),
		);
	});

	it("uses the drill-down table style at 11px", () => {
		renderList();
		// Header: the drill-down's py-2, bold foreground, normal case; 11px instead of 10.5px; no divider below it.
		const header = screen.getByTestId("market-list-header");
		expect(header).toHaveClass("py-2", "font-bold", "text-foreground");
		expect(header).not.toHaveClass("border-b");
		expect(header.className).not.toMatch(/uppercase|text-\[#525866\]/);
		expect(header.parentElement).toHaveClass("text-[11px]");
		expect(header.parentElement?.className).not.toMatch(/text-xs/);

		// Rows: square, faint divider, soft hover tint, primary focus outline.
		const boston = screen.getByRole("button", { name: "Boston" });
		expect(boston).toHaveClass(
			"cursor-pointer",
			"hover:bg-foreground/[0.07]",
			"focus:bg-foreground/[0.07]",
			"rounded-[6px]",
			"focus-visible:outline-primary",
			"pl-3",
		);
		expect(boston.parentElement).toHaveClass(...MODULE_ROW_DIVIDER_CLASS.split(" "));
		const chevron = within(boston).getByTestId("market-row-chevron");
		expect(chevron).toHaveAttribute("aria-hidden", "true");
		expect(chevron).toHaveAttribute("width", "12");
		expect(chevron).toHaveAttribute("stroke-width", "1.5");
		expect(chevron).toHaveClass("text-[#9ca3af]");
		// Drill-down row padding plus 2px top and bottom.
		expect(boston).toHaveClass("py-[calc(0.375rem+2px)]");
		expect(boston.parentElement?.className).not.toMatch(/dashed/);
		expect(screen.getByText("Boston")).toHaveClass("font-normal", "text-foreground");
		const games = boston.querySelector(".tabular-nums.text-right");
		expect(games).toHaveTextContent("80");

		// No status word or colored dot; the change pill keeps an arrow and a sign.
		expect(boston).not.toHaveTextContent("declining");
		expect(boston.querySelector("[class*='rounded-full'][class*='size-2']")).toBeNull();
		expect(within(boston).getByTestId("market-row-detail")).toHaveTextContent("1 of 1 active");
		expect(boston).toHaveTextContent("-30%");
		expect(boston.querySelector("svg path")).not.toBeNull();
		// Brighter shared pill: vivid red for a fall, vivid green for a rise.
		expect(within(boston).getByTestId("market-row-change")).toHaveClass(
			"bg-[#ef4444]/[0.16]",
			"border-[#ef4444]/40",
			"text-[#b91c1c]",
		);
		const austin = screen.getByRole("button", { name: "Austin" });
		expect(within(austin).getByTestId("market-row-change")).toHaveClass(
			"bg-[#22c55e]/[0.18]",
			"border-[#22c55e]/45",
			"text-[#15703a]",
		);
	});

	it("shows every market without a CTA when there are 6 or fewer", () => {
		renderList(ROWS.slice(0, 5));
		expect(screen.getAllByRole("listitem")).toHaveLength(5);
		expect(screen.queryByRole("button", { name: /See all/ })).not.toBeInTheDocument();
	});

	it("renders the Facilities module with the same table, See all / Show less and no divider below the last row", () => {
		const facilities = ROWS.map((item) => ({
			...item,
			detail: "Houston",
			status: null,
			statusLabel: null,
			changePercent: null,
			changeDirection: null,
			changeLabel: "",
		}));
		render(
			<MarketList
				kind="facilities"
				rows={facilities}
				emptyLabel="None"
				seeAllLabel="See all 8 facilities"
				messages={EN_MESSAGES.marketSummary}
				hero={HERO}
				onSelect={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("heading", { level: 3, name: "Active facilities" }),
		).toBeInTheDocument();
		const header = screen.getByTestId("facility-list-header");
		expect(within(header).getByRole("button", { name: /Facility/ })).toBeInTheDocument();
		// Same sortable "vs prev" column as Markets, with the shared pill.
		const vsPrev = within(header).getByRole("button", { name: /vs prev/ });
		fireEvent.click(vsPrev);
		expect(vsPrev).toHaveAttribute("aria-pressed", "true");
		fireEvent.click(within(header).getByRole("button", { name: /Games/ }));
		expect(screen.getAllByTestId("market-row-change")[0]).toHaveClass(
			"h-[16px]",
			"px-[5px]",
			"rounded-full",
		);
		expect(screen.getAllByRole("listitem")).toHaveLength(5);
		const cta = screen.getByRole("button", { name: "See all 8 facilities" });
		expect(cta).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(cta);
		expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(8);
		// Dividers are drawn above every row but the first: nothing below the last row.
		for (const item of items) {
			expect(item.className).not.toMatch(/(^|\s)border-b/);
			expect(item).toHaveClass("not-first:before:h-px", "not-first:before:bg-foreground/[0.08]");
		}
	});
});
