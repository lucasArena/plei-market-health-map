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
	summary: "12 games played last week.",
	tiles: [
		{
			key: "played",
			label: "Played last week",
			value: "12",
			hint: "+20% vs previous week",
			hintDirection: "up",
		},
		{ key: "scheduled", label: "Scheduled", value: "16", hint: null, hintDirection: "flat" },
	],
	weekLabel: "Week of Sep 21 – Sep 27, 2026",
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
		expect(screen.getByText("12 games played last week.")).toBeInTheDocument();
		expect(screen.getByText("+20% vs previous week")).toHaveClass("text-emerald-700");
		expect(screen.getByText("16")).toBeInTheDocument();
		expect(screen.getByText(VIEW.weekLabel)).toBeInTheDocument();
		expect(screen.getByText(VIEW.lastPlayedLabel)).toBeInTheDocument();
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
