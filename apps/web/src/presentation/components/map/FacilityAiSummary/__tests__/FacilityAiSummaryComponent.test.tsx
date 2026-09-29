import { fireEvent, render, screen } from "@testing-library/react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import { FacilityAiSummary } from "@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent.rules", () => ({
	useFacilityAiSummaryRules: () => mockRules(),
}));

const messages = EN_MESSAGES.facilityAi;

function rulesWith(status: string, overrides: object = {}) {
	return {
		handleGenerate: vi.fn(),
		messages,
		progressLabel: "Loading the AI model on this device… 40%",
		progressPercent: 40,
		status,
		text: "Summary text.",
		...overrides,
	};
}

function renderSummary() {
	render(<FacilityAiSummary detail={FACILITY_DETAIL} fallback="Summary text." />);
}

describe("FacilityAiSummary", () => {
	it("offers the one-time download", () => {
		const rules = rulesWith("idle");
		mockRules.mockReturnValue(rules);
		renderSummary();

		fireEvent.click(screen.getByRole("button", { name: `✨ ${messages.generate}` }));

		expect(screen.getByText("Summary text.")).toBeInTheDocument();
		expect(screen.getByText(messages.downloadHint)).toBeInTheDocument();
		expect(rules.handleGenerate).toHaveBeenCalled();
	});

	it("shows the download progress", () => {
		mockRules.mockReturnValue(rulesWith("loading"));
		renderSummary();

		expect(screen.getByRole("status")).toHaveTextContent("40%");
		expect(screen.getByTestId("ai-summary-progress")).toHaveStyle({ width: "40%" });
	});

	it.each([
		["generating", messages.writing],
		["ready", messages.label],
		["error", messages.failed],
	])("labels the %s state", (status, label) => {
		mockRules.mockReturnValue(rulesWith(status));
		renderSummary();

		expect(screen.getByText(label)).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("shows only the text when unsupported", () => {
		mockRules.mockReturnValue(rulesWith("unsupported"));
		renderSummary();

		expect(screen.getByText("Summary text.")).toBeInTheDocument();
		expect(screen.getByText(messages.label)).toBeInTheDocument();
	});

	it("marks a finished AI summary with the sparkle icon", () => {
		mockRules.mockReturnValue(rulesWith("ready"));
		renderSummary();

		expect(screen.getByText("AI summary")).toBeInTheDocument();
		expect(screen.getByTestId("ai-summary-icon")).toBeInTheDocument();
	});
});
