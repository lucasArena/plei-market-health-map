import { fireEvent, render, screen } from "@testing-library/react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import { FacilityDetailPanel } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent", () => ({
	FacilityAiSummary: ({ fallback }: { fallback: string }) => <p>{fallback}</p>,
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
		},
		{
			key: "confirmation",
			label: "Confirmation rate",
			value: "82%",
			hint: null,
			hintDirection: "flat",
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
	lastPlayedLabel: "Last game played Sep 27, 2026",
};

function rulesWith(overrides: object = {}) {
	return {
		detail: FACILITY_DETAIL,
		handleAnimationEnd: vi.fn(),
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
		expect(screen.getByText(VIEW.lastPlayedLabel)).toBeInTheDocument();
		expect(screen.queryByText("Week of Sep 21 – Sep 27, 2026")).not.toBeInTheDocument();
	});

	it("closes from the button and reports the end of the animation", () => {
		const rules = rulesWith({ isClosing: true });
		mockRules.mockReturnValue(rules);

		render(<FacilityDetailPanel {...PROPS} isClosing />);
		fireEvent.click(screen.getByRole("button", { name: "Close facility details" }));
		const panel = screen.getByRole("complementary");
		fireEvent(panel, new Event("webkitAnimationEnd", { bubbles: true }));

		expect(panel).toHaveClass("panel-slide-out");
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
