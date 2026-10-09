import { render, screen } from "@testing-library/react";
import { FacilityOverview } from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.rules", () => ({
	useFacilityOverviewRules: () => mockRules(),
}));

const HEADER = {
	breadcrumb: [{ key: "889", label: "Pegaso HTX" }],
	breadcrumbLabel: "Location",
	title: "Pegaso HTX",
	level: "Facility",
	subtitle: "123 Main St",
	periodLabel: "Comparison period",
	periodOptions: [{ value: "month", label: "28D" }],
	comparison: { current: "Sep 11 – Oct 8, 2026", previous: "vs Aug 14 – Sep 10" },
	footnote: null,
};

const CARD = { label: "Games played", info: "i", value: "222", change: null };

const ROW = {
	key: "r",
	label: "Avg players per game",
	value: "11.4",
	previous: "vs 10.9",
	change: null,
};

const BASE = {
	header: HEADER,
	period: "month",
	setPeriod: vi.fn(),
	scorecardsTitle: "Scorecards",
	trendTitle: "Games trend",
	trendAside: "Weekly, last 8 weeks",
	demand: { title: "Demand", rows: [ROW] },
	satisfactionPending: { title: "Player satisfaction", rows: [{ ...ROW, isPending: true }] },
};

const SECTIONS = {
	status: {
		tone: "attention",
		label: "Needs attention",
		headline: "Pegaso HTX: down.",
		detail: null,
	},
	scorecards: { played: CARD, confirmation: CARD, cancellation: CARD },
	trend: {
		total: "222",
		change: null,
		comparison: "vs 276",
		direction: "down",
		axisMax: null,
		axisLabel: null,
		points: [],
		metrics: [],
	},
};

describe("FacilityOverview", () => {
	it("shows the facility header, status, scorecards, trend, popular times, demand and satisfaction", () => {
		mockRules.mockReturnValue({
			...BASE,
			sections: SECTIONS,
			popularTimes: {
				title: "Popular times · last 28 days",
				dayLabels: ["Mon"],
				periodLabels: ["Morning"],
				periodRanges: ["6–12"],
				cells: [],
				quietLabel: "Quiet",
				busyLabel: "Busy",
			},
			satisfaction: {
				title: "Player satisfaction",
				rows: [ROW],
				footnote: "Based on 84 reviews",
				reviewsTitle: "Recent low reviews",
				reviews: [{ id: "r1", rate: "2 ★", date: "Oct 3", title: "Field was flooded" }],
				emptyReviews: "No low reviews.",
			},
		});

		render(<FacilityOverview facilityId="889" facilityName="Pegaso HTX" marketName="Houston" />);

		expect(screen.getByRole("heading", { name: "Pegaso HTX" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "28D" })).not.toBeInTheDocument();
		expect(screen.getByTestId("status-summary")).toHaveTextContent("Needs attention");
		expect(screen.getByTestId("score-played")).toBeInTheDocument();
		expect(screen.getByTestId("facility-games-trend")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Popular times · last 28 days" }),
		).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Demand" })).toHaveTextContent(
			"Avg players per game11.4",
		);
		expect(screen.getByText("Based on 84 reviews")).toBeInTheDocument();
		expect(screen.getByTestId("facility-low-reviews")).toHaveTextContent(
			"2 ★Field was floodedOct 3",
		);
	});

	it("holds placeholders while loading and says when there are no low reviews", () => {
		mockRules.mockReturnValue({ ...BASE, sections: null, popularTimes: null, satisfaction: null });
		const { unmount } = render(
			<FacilityOverview facilityId="889" facilityName="Pegaso HTX" marketName="Houston" />,
		);

		expect(screen.queryByTestId("status-summary")).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: /Popular times/ })).not.toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Player satisfaction" })).toBeInTheDocument();
		unmount();

		mockRules.mockReturnValue({
			...BASE,
			sections: null,
			popularTimes: null,
			satisfaction: {
				title: "Player satisfaction",
				rows: [ROW],
				footnote: null,
				reviewsTitle: "Recent low reviews",
				reviews: [],
				emptyReviews: "No low reviews in the last 28 days.",
			},
		});
		render(<FacilityOverview facilityId="889" facilityName="Pegaso HTX" marketName="Houston" />);
		expect(screen.getByText("No low reviews in the last 28 days.")).toBeInTheDocument();
		expect(screen.queryByTestId("facility-low-reviews")).not.toBeInTheDocument();
	});
});
