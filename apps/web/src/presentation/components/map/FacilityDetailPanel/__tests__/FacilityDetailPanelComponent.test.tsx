import { fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { FacilityDetailPanel } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent", () => ({
	AiSummarySkeleton: ({ testId }: { testId: string }) => (
		<div data-testid={testId} aria-busy="true" />
	),
}));

vi.mock("@/presentation/components/displays/AiSummary/AiSummaryComponent", () => ({
	AiSummary: ({ fallback }: { fallback: string }) => <p>{fallback}</p>,
}));
vi.mock(
	"@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules",
	() => ({
		useFacilityDetailPanelRules: () => mockRules(),
	}),
);

const VIEW = {
	name: "Pegaso HTX",
	address: "1 Main St, Houston, TX",
	avatarUrl: null,
	summary: "41 games brought in 7 newly activated players.",
	tiles: [
		{
			key: "played",
			label: "Games played",
			value: "41",
			hint: "+20% vs previous period",
			hintDirection: "up",
			isLoading: false,
		},
		{
			key: "confirmation",
			label: "Confirmation rate",
			value: "82%",
			hint: null,
			hintDirection: "flat",
			isLoading: false,
		},
	],
	weeklyActivity: [
		{
			key: "2026-09-21",
			label: "Sep 21",
			shortLabel: "Sep 21",
			value: 12,
			valueLabel: "12 games",
			tooltip: "Sep 21: 12 games",
		},
	],
	popularTimes: [
		{
			key: "1-0",
			dayLabel: "Mon",
			periodLabel: "Morning",
			value: 2,
			label: "Mon, Morning: 2 games",
			tooltip: "2 games",
			intensity: 4,
		},
	],
	dayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
	timePeriodLabels: ["Morning", "Afternoon", "Evening", "Late night"],
	lastPlayedLabel: "Last game played Sep 27, 2026",
};

function rulesWith(overrides: object = {}) {
	return {
		aiContext: { cacheKey: "v4:facility-889:2026-09-21:en", prompt: [] },
		handleAnimationEnd: vi.fn(),
		isAiPending: false,
		isClosing: false,
		messages: EN_MESSAGES.facilityDetail,
		onClose: vi.fn(),
		status: "ready",
		view: VIEW,
		...overrides,
	};
}

const PROPS = { facilityId: "889", isClosing: false, onClose: vi.fn(), onClosed: vi.fn() };

describe("FacilityDetailPanel", () => {
	it("renders the facility details and stats", () => {
		mockRules.mockReturnValue(rulesWith());

		render(<FacilityDetailPanel {...PROPS} />);

		const panel = screen.getByRole("complementary", { name: "Facility details" });
		expect(panel).toHaveClass("panel-slide-in");
		expect(screen.getByRole("heading", { name: "Pegaso HTX" })).toBeInTheDocument();
		expect(screen.getByText("1 Main St, Houston, TX")).toBeInTheDocument();
		expect(screen.getByText("41 games brought in 7 newly activated players.")).toBeInTheDocument();
		expect(screen.getByText("+20% vs previous period")).toHaveClass(
			"whitespace-nowrap",
			"text-emerald-700",
		);
		expect(screen.getByText("82%")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Weekly activity" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sep 21: 12 games" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Mon, Morning: 2 games" })).toBeInTheDocument();
		expect(screen.getByText(VIEW.lastPlayedLabel)).toBeInTheDocument();
		expect(screen.queryByText("Week of Sep 21 – Sep 27, 2026")).not.toBeInTheDocument();
	});

	it("omits the games trend card even when trend data is supplied", () => {
		mockRules.mockReturnValue(
			rulesWith({
				trend: {
					level: "down",
					title: "Games trend",
					compare: "42 games now vs 51 in the previous 28 days",
					change: "-18% vs previous 28 days",
				},
			}),
		);

		render(<FacilityDetailPanel {...PROPS} />);

		expect(screen.queryByTestId("facility-games-trend")).not.toBeInTheDocument();
	});

	it("leaves the trend out while trend is off", () => {
		mockRules.mockReturnValue(rulesWith({ trend: null }));

		render(<FacilityDetailPanel {...PROPS} />);

		expect(screen.queryByTestId("facility-games-trend")).not.toBeInTheDocument();
	});

	it("renders reservation analytics while player stats and AI continue loading", () => {
		mockRules.mockReturnValue(
			rulesWith({
				aiContext: null,
				isAiPending: true,
				view: {
					...VIEW,
					summary: null,
					tiles: [
						VIEW.tiles[0],
						{
							key: "players",
							label: "Unique players",
							value: "",
							hint: null,
							hintDirection: "flat",
							isLoading: true,
						},
					],
				},
			}),
		);

		render(<FacilityDetailPanel {...PROPS} />);

		expect(screen.getByText("41")).toBeInTheDocument();
		expect(screen.getByTestId("facility-stat-players-skeleton")).toBeInTheDocument();
		expect(screen.getByTestId("facility-ai-summary-skeleton")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Weekly activity" })).toBeInTheDocument();
	});

	it("closes from the button and reports the end of the animation", () => {
		const rules = rulesWith({ isClosing: true });
		mockRules.mockReturnValue(rules);

		render(<FacilityDetailPanel {...PROPS} isClosing />);
		fireEvent.click(screen.getByRole("button", { name: "Close facility details" }));
		const panel = screen.getByRole("complementary");
		fireEvent(panel, new Event("webkitAnimationEnd", { bubbles: true }));

		expect(panel).toHaveClass(
			"panel-slide-out",
			"map-glass",
			"right-[var(--map-frame)]",
			"shadow-[var(--map-shadow)]",
		);
		expect(rules.onClose).toHaveBeenCalled();
		expect(rules.handleAnimationEnd).toHaveBeenCalled();
	});

	it("shows a skeleton while loading", () => {
		mockRules.mockReturnValue(rulesWith({ status: "loading", view: null, detail: undefined }));

		render(<FacilityDetailPanel {...PROPS} />);

		expect(screen.getByTestId("facility-detail-skeleton")).toBeInTheDocument();
		expect(screen.getByRole("complementary", { hidden: true })).toHaveAttribute(
			"aria-busy",
			"true",
		);
	});

	it("shows an error", () => {
		mockRules.mockReturnValue(rulesWith({ status: "error", view: null, detail: undefined }));

		render(<FacilityDetailPanel {...PROPS} />);

		expect(screen.getByRole("alert")).toHaveTextContent("Could not load this facility.");
	});
});
