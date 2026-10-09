import { render, screen, within } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { GamesMetricsList } from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent";
import type { GamesCardView } from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.types";
import {
	METRIC_LABEL_CLASS,
	MODULE_ROW_DIVIDER_CLASS,
} from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";

const VIEW: GamesCardView = {
	title: "Games in the last 28 days",
	hero: {
		value: "172",
		comparison: "vs 178 in the previous 28 days",
		change: {
			direction: "down",
			tone: "worse",
			label: "\u22123%",
			description: "Worsened \u22123%",
		},
	},
	series: [
		{
			key: "2026-09-09",
			label: "Sep 9",
			value: 45,
			valueLabel: "45",
			tooltipDetail: "games \u00b7 Sep 9",
			rangeLabel: "Sep 9 \u2013 Sep 15",
			gamesLabel: "45 games",
			change: null,
			summary: "Week of Sep 9 \u2013 Sep 15: 45 games. No previous week to compare",
		},
		{
			key: "2026-09-30",
			label: "Sep 30",
			value: 41,
			valueLabel: "41",
			tooltipDetail: "games \u00b7 Sep 30",
			rangeLabel: "Sep 30 \u2013 Oct 6",
			gamesLabel: "41 games",
			change: {
				direction: "down",
				tone: "worse",
				label: "\u22129%",
				description: "Worsened \u22129%",
			},
			summary: "Week of Sep 30 \u2013 Oct 6: 41 games. Worsened \u22129% vs previous week",
		},
	],
	axisMax: 50,
	ticks: [0, 10, 20, 30, 40, 50].map((value) => ({ value, label: String(value) })),
	rows: [
		{
			key: "confirmation",
			label: "Confirmation rate",
			value: "75%",
			previousLabel: "vs 83%",
			change: {
				direction: "down",
				tone: "worse",
				label: "\u22128 pts",
				description: "Worsened \u22128 pts",
			},
		},
		{
			key: "cancellation",
			label: "Cancellation rate",
			value: "11%",
			previousLabel: null,
			change: null,
		},
	],
};

describe("GamesMetricsList", () => {
	it("leads with games played, its pill and the previous-period comparison", () => {
		render(<GamesMetricsList view={VIEW} messages={EN_MESSAGES.marketSummary} />);

		const title = screen.getByRole("heading", { level: 3, name: "Games in the last 28 days" });
		// Styled like the "Unique players" label: 11px regular #525866 on a 13px line, 3px above the number.
		expect(title).toHaveClass(...METRIC_LABEL_CLASS.split(" "), "leading-[13px]");
		expect(title).not.toHaveClass("text-base", "font-semibold");
		expect(title.parentElement).toHaveClass("gap-[3px]");
		expect(title.nextElementSibling).toBe(screen.getByTestId("games-hero"));
		expect(screen.getByRole("region", { name: "Games in the last 28 days" })).toBeInTheDocument();
		const hero = screen.getByTestId("games-hero");
		expect(within(hero).getByText("172")).toBeInTheDocument();
		expect(within(hero).getByText("vs 178 in the previous 28 days")).toBeInTheDocument();
		expect(within(hero).getByText("Worsened \u22123%")).toHaveClass("sr-only");
		expect(hero.querySelector("[data-tone='worse']")).toHaveClass(
			"h-[16px]",
			"text-[11px]",
			"px-[5px]",
			"gap-[2px]",
			"bg-[#ef4444]/[0.16]",
			"border-[#ef4444]/40",
			"backdrop-blur-[6px]",
			"text-[#b91c1c]",
		);
		// Smaller 9px arrow; the arrow and the sign keep meaning off color alone.
		expect(hero.querySelector("[data-tone='worse'] svg")).toHaveClass("size-[9px]");
		// The pill sits next to the number; the comparison gets its own line below.
		const comparison = screen.getByTestId("games-hero-comparison");
		expect(hero.lastElementChild).toBe(comparison);
		expect(comparison.previousElementSibling).toContainElement(screen.getByText("172"));
		expect(comparison.previousElementSibling).toContainElement(
			hero.querySelector("[data-tone='worse']") as HTMLElement,
		);
		expect(hero).toHaveClass("flex-col");
	});

	it("draws a green line with a gradient on the drill-down grid, with an 11px scale", () => {
		render(<GamesMetricsList view={VIEW} messages={EN_MESSAGES.marketSummary} />);

		const chart = screen.getByTestId("games-chart");
		const gridlines = screen.getAllByTestId("games-chart-gridline");
		expect(gridlines).toHaveLength(6);
		expect(gridlines[0]).toHaveClass("border-dashed", "border-foreground/15");
		expect(within(gridlines.at(-1) as HTMLElement).getByText("50")).toHaveClass("text-[11px]");
		expect(screen.getByTestId("games-chart-plot")).toHaveClass("h-[117px]");
		const line = chart.querySelector("polyline");
		expect(line).toHaveAttribute("points", "0,10 100,18");
		// Points, line and labels share a 10px side inset: enough for the hovered dot and its ring.
		expect(screen.getByTestId("games-chart-points")).toHaveClass("inset-x-[10px]");
		expect(screen.getByTestId("games-chart-points")).toContainElement(
			line as unknown as HTMLElement,
		);
		const labels = screen.getAllByTestId("games-chart-x-label");
		expect(labels[0]).toHaveStyle({ left: "0%" });
		expect(labels[1]).toHaveStyle({ left: "100%" });
		expect(labels[1]).toHaveClass("-translate-x-[calc(100%-10px)]");
		expect(screen.getAllByTestId("games-chart-dot")[1]).toHaveStyle({
			left: "100%",
			width: "100%",
		});
		expect(line).toHaveAttribute("stroke", "#3D8C77");
		expect(line).toHaveAttribute("stroke-width", "2");
		expect(chart.querySelector("polygon")?.getAttribute("fill")).toMatch(/^url\(#games-area-/);
		expect(chart.querySelectorAll("linearGradient stop")).toHaveLength(2);
		expect(screen.queryByTestId("games-chart-bar")).not.toBeInTheDocument();
		expect(screen.getByText("Sep 30", { selector: "span[title]" })).toHaveClass("text-[11px]");
	});

	it("centers every dot exactly on its line vertex, in the same plot box as the line", () => {
		render(<GamesMetricsList view={VIEW} messages={EN_MESSAGES.marketSummary} />);

		const line = screen.getByTestId("games-chart-line");
		const vertices = (line.querySelector("polyline")?.getAttribute("points") ?? "")
			.split(" ")
			.map((pair) => pair.split(",").map(Number));
		const dots = screen.getAllByTestId("games-chart-dot");
		expect(vertices).toHaveLength(dots.length);
		const box = screen.getByTestId("games-chart-points");
		dots.forEach((dot, index) => {
			const [x, y] = vertices[index] ?? [];
			// Same container as the SVG (which fills it with a 0–100 viewBox).
			expect(dot.parentElement).toBe(box);
			expect(dot).toHaveStyle({ left: `${x}%` });
			expect(dot).toHaveClass("-translate-x-1/2", "top-0", "h-full");
			const vertex = within(dot).getByTestId("games-chart-vertex");
			expect(vertex).toHaveStyle({ top: `${y}%` });
			expect(vertex).toHaveClass("left-1/2", "size-0");
			const mark = within(dot).getByTestId("games-chart-dot-mark");
			expect(mark).toHaveClass("top-0", "left-0", "-translate-x-1/2", "-translate-y-1/2");
			expect(mark).not.toHaveClass("translate-y-1/2");
		});
		expect(line.parentElement).toBe(box);
		expect(line).toHaveClass("inset-0", "size-full");
	});

	it("shows a focusable dot per week with a richer tooltip", () => {
		render(<GamesMetricsList view={VIEW} messages={EN_MESSAGES.marketSummary} />);

		const dots = screen.getAllByTestId("games-chart-dot");
		expect(dots).toHaveLength(2);
		expect(dots[1]).toHaveAccessibleName(
			"Week of Sep 30 \u2013 Oct 6: 41 games. Worsened \u22129% vs previous week",
		);
		dots[1]?.focus();
		expect(dots[1]).toHaveFocus();
		expect(dots[1]).toHaveClass("group", "focus-visible:outline-none");
		const mark = within(dots[1] as HTMLElement).getByTestId("games-chart-dot-mark");
		expect(mark).toHaveClass("group-hover:scale-125", "group-focus-visible:ring-2");
		// Always-visible dots with a white ring, stacked above the line and gradient.
		expect(mark).toHaveClass("size-2.5", "border-2", "border-white");
		expect(mark).not.toHaveClass("opacity-0");
		expect(dots[1]).toHaveClass("z-[1]");
		const svg = screen.getByTestId("games-chart-line");
		expect(svg).toHaveClass("z-0");
		expect(
			svg.compareDocumentPosition(dots[0] as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();

		const [first, second] = screen.getAllByTestId("games-chart-tooltip");
		expect(first).toHaveTextContent("Sep 9 \u2013 Sep 15");
		expect(first).toHaveTextContent("45 games");
		expect(first).toHaveTextContent("No previous week to compare");
		expect(first).toHaveClass(
			"left-0",
			"rounded-md",
			"map-glass",
			"border-border",
			"shadow-[var(--map-shadow)]",
			"group-focus-visible:opacity-100",
		);
		expect(first).not.toHaveClass("bg-background");
		expect(second).toHaveClass("right-0");
		// Both dots are in the plot's upper half (45 and 41 of 50), so the tooltips open below them.
		expect(first).toHaveClass("top-full", "mt-3");
		expect(first).not.toHaveClass("bottom-full");
		expect(second).toHaveTextContent("\u22129%vs previous week");
		expect(within(second as HTMLElement).getByText("\u22129%")).toHaveClass("text-[#b91c1c]");
		expect(second?.querySelector("svg")).not.toBeNull();

		// The dots are the text alternative; no hidden list repeating them.
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("lists the secondary metrics and explains a missing comparison to screen readers", () => {
		render(<GamesMetricsList view={VIEW} messages={EN_MESSAGES.marketSummary} />);

		const confirmation = screen.getByTestId("games-metric-confirmation");
		expect(within(confirmation).getByText("75%")).toBeInTheDocument();
		expect(within(confirmation).getByText("vs 83%")).toBeInTheDocument();
		const cancellation = screen.getByTestId("games-metric-cancellation");
		expect(within(cancellation).getByText("No previous period to compare")).toBeInTheDocument();
		// Same label style as the "Unique players" tile.
		for (const label of ["Confirmation rate", "Cancellation rate"]) {
			expect(screen.getByText(label)).toHaveClass(...METRIC_LABEL_CLASS.split(" "));
		}
		// One subtle container wraps the whole module; the rows use spacing only (no inner box or dividers).
		const module = screen.getByRole("region", { name: "Games in the last 28 days" });
		expect(module).toHaveClass(
			"rounded-[10px]",
			"bg-foreground/[0.03]",
			"border",
			"border-foreground/[0.06]",
			"p-[12px]",
		);
		expect(module.className).not.toMatch(/overflow-(hidden|clip)/);
		for (const id of ["games-title-group", "games-chart", "games-metrics-rows"]) {
			expect(module).toContainElement(screen.getByTestId(id));
		}
		const container = screen.getByTestId("games-metrics-rows");
		// Faint dividers between rows only (container border color); the 8px gap is split around them.
		expect(container).toHaveClass("[&>div+div]:mt-[4px]", "[&>div+div]:pt-[7px]");
		expect(confirmation).toHaveClass(...MODULE_ROW_DIVIDER_CLASS.split(" "));
		expect(container.className).not.toMatch(/(^|\s)(rounded|border|bg-|p-\[)/);
		expect(confirmation.parentElement).toBe(container);
		for (const row of [confirmation, cancellation]) {
			expect(row.className).not.toMatch(/border-t|pt-2/);
		}
		expect(confirmation).toHaveClass("gap-y-[3px]", "py-[2px]");
		expect(screen.getByText("Confirmation rate")).toHaveClass("text-[11px]", "leading-[13px]");
		expect(within(confirmation).getByText("75%")).toHaveClass(
			"text-[11px]",
			"leading-[18px]",
			"font-semibold",
			"text-[#1d1d1f]",
		);
		// Same size as the grey comparison; weight and color carry the hierarchy.
		expect(within(confirmation).getByText("vs 83%")).toHaveClass("text-[11px]");
		expect(screen.queryByText(/popular times/i)).not.toBeInTheDocument();
	});

	it("keeps a loading row's label and shows placeholders, not numbers, until it arrives", () => {
		render(
			<GamesMetricsList
				idPrefix="users"
				icon="users"
				view={{
					...VIEW,
					rows: [
						{
							key: "registrations",
							label: "New registrations",
							value: "",
							previousLabel: null,
							change: null,
							isPending: true,
							pendingLabel: "Loading New registrations…",
						},
					],
				}}
				messages={EN_MESSAGES.marketSummary}
			/>,
		);
		const row = screen.getByTestId("users-metric-registrations");
		expect(row).toHaveAttribute("aria-busy", "true");
		expect(within(row).getByText("New registrations")).toBeInTheDocument();
		expect(within(row).getByText("Loading New registrations…")).toHaveClass("sr-only");
		expect(screen.getByTestId("users-metric-registrations-pending")).toBeInTheDocument();
		expect(within(row).queryByText(EN_MESSAGES.marketSummary.gamesNoPrevious)).toBeNull();
	});

	it("hides the chart when the API returns no points", () => {
		render(
			<GamesMetricsList view={{ ...VIEW, series: [] }} messages={EN_MESSAGES.marketSummary} />,
		);
		expect(screen.queryByTestId("games-chart-tooltip")).not.toBeInTheDocument();
		expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
	});
});
