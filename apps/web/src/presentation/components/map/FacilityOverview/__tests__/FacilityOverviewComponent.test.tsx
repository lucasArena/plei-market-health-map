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

const BASE = {
	header: HEADER,
	period: "month",
	setPeriod: vi.fn(),
	scorecardsTitle: "Scorecards",
	trendTitle: "Games trend",
	trendAside: "Weekly, last 8 weeks",
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
	it("shows the facility header, status, scorecards, trend and popular times", () => {
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
		expect(screen.queryByRole("region", { name: "Demand" })).not.toBeInTheDocument();
		expect(screen.queryByRole("region", { name: "Player satisfaction" })).not.toBeInTheDocument();
	});

	it("shows only the header until the facility stats load", () => {
		mockRules.mockReturnValue({ ...BASE, sections: null, popularTimes: null });

		render(<FacilityOverview facilityId="889" facilityName="Pegaso HTX" marketName="Houston" />);

		expect(screen.getByRole("heading", { name: "Pegaso HTX" })).toBeInTheDocument();
		expect(screen.queryByTestId("status-summary")).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: /Popular times/ })).not.toBeInTheDocument();
	});
});
