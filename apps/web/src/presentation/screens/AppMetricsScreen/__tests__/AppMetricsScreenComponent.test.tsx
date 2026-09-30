import { fireEvent, render, screen, within } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { AppMetricsScreen } from "@/presentation/screens/AppMetricsScreen/AppMetricsScreenComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/screens/AppMetricsScreen/AppMetricsScreenComponent.rules", () => ({
	useAppMetricsScreenRules: () => mockRules(),
}));

const messages = EN_MESSAGES.appMetrics;

function rulesWith(overrides: object = {}) {
	return {
		messages,
		page: 1,
		pageCount: 2,
		pageLabel: "Page 1 of 2",
		setPage: vi.fn(),
		status: "ready",
		view: {
			tiles: [
				{
					key: "goal",
					label: "Weekly goal",
					value: "81.8%",
					hint: "9 of 11 target users · goal 75%",
					hintDirection: "up",
					isLoading: false,
				},
			],
			weekly: {
				all: [
					{
						key: "2026-09-28",
						label: "Sep 28",
						shortLabel: "Sep 28",
						value: 14,
						valueLabel: "14",
						tooltip: "Week of Sep 28: 14 people active",
					},
				],
				targets: [
					{
						key: "2026-09-28",
						label: "Sep 28",
						shortLabel: "Sep 28",
						value: 9,
						valueLabel: "9",
						tooltip: "Week of Sep 28: 9 of 11 target users (81.8%)",
					},
				],
			},
		},
		rows: [
			{
				key: "stefano@plei.com",
				name: "Stefano Sanchez",
				email: "stefano@plei.com",
				isTarget: true,
				days: "4",
				visits: "9",
				minutes: "73",
				topFeature: "Market summary",
				lastSeen: "Sep 30, 2026",
			},
			{
				key: "guest@plei.com",
				name: "guest@plei.com",
				email: null,
				isTarget: false,
				days: "1",
				visits: "1",
				minutes: "2",
				topFeature: "—",
				lastSeen: "Sep 30, 2026",
			},
		],
		...overrides,
	};
}

describe("AppMetricsScreen", () => {
	it("shows the goal, the weekly chart and the people table", () => {
		const rules = rulesWith();
		mockRules.mockReturnValue(rules);
		render(<AppMetricsScreen />);

		expect(screen.getByRole("heading", { name: "App metrics" })).toBeInTheDocument();
		expect(screen.getByText("81.8%")).toBeInTheDocument();
		expect(screen.getByText("9 of 11 target users · goal 75%")).toHaveClass("text-emerald-700");
		expect(screen.getByRole("heading", { name: "Weekly usage" })).toBeInTheDocument();
		expect(screen.getByText("All users")).toBeInTheDocument();
		expect(screen.getByText("Target users")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Week of Sep 28: 9 of 11 target users (81.8%)" }),
		).toBeInTheDocument();
		const table = screen.getByRole("table", { name: "People this week" });
		const [, stefano, guest] = within(table).getAllByRole("row");
		expect(stefano).toHaveTextContent("Stefano Sanchez");
		expect(stefano).toHaveTextContent("Target");
		expect(stefano).toHaveTextContent("stefano@plei.com");
		expect(guest).not.toHaveTextContent("Target");
		expect(screen.getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");

		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(rules.setPage).toHaveBeenCalledWith(2);
	});

	it("shows loading and error states", () => {
		mockRules.mockReturnValue(rulesWith({ status: "loading", view: null }));
		const { rerender } = render(<AppMetricsScreen />);
		expect(screen.getByTestId("app-metrics-skeleton")).toBeInTheDocument();

		mockRules.mockReturnValue(rulesWith({ status: "error", view: null }));
		rerender(<AppMetricsScreen />);
		expect(screen.getByRole("alert")).toHaveTextContent("Could not load the app metrics.");
	});
});
