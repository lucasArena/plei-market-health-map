import { fireEvent, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { FeatureFlagsScreen } from "@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent";

const mockRules = vi.fn();
const toggle = vi.fn();

vi.mock("@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent.rules", () => ({
	useFeatureFlagsScreenRules: () => mockRules(),
}));

const ROW = {
	key: "new-panel",
	description: "Shows the new market panel",
	enabled: true,
	state: "on",
	statusLabel: "On",
	requirement: null,
	toggleLabel: "Turn new-panel off",
	lastChange: "stefano@plei.com · Oct 1, 2026",
};

function rulesWith(overrides: Record<string, unknown> = {}) {
	return {
		backToMapLabel: "Back to the map",
		errorMessage: null,
		messages: EN_MESSAGES.featureFlags,
		pendingKey: null,
		rows: [
			ROW,
			{
				...ROW,
				key: "quiet",
				description: "",
				enabled: false,
				state: "off",
				statusLabel: "Off",
				toggleLabel: "Turn quiet on",
				lastChange: "Never switched",
			},
			{
				...ROW,
				key: "needs-panel",
				description: "",
				statusLabel: "On, waiting for new-panel",
				requirement: "Only takes effect while new-panel is on.",
				toggleLabel: "Turn needs-panel off",
				lastChange: "Never switched",
			},
		],
		status: "ready",
		toggle,
		...overrides,
	};
}

describe("FeatureFlagsScreen", () => {
	beforeEach(() => vi.clearAllMocks());

	it("lists the flags with a switch each, under the admin tabs", () => {
		mockRules.mockReturnValue(rulesWith());
		renderWithMessages(<FeatureFlagsScreen />);

		expect(screen.getByRole("link", { name: "Feature flags" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(screen.getByRole("heading", { name: "Feature flags" })).toBeInTheDocument();
		expect(screen.getByText("Shows the new market panel")).toBeInTheDocument();
		expect(screen.getByText("stefano@plei.com · Oct 1, 2026")).toBeInTheDocument();
		const switches = screen.getAllByRole("switch");
		expect(switches[0]).toHaveAttribute("aria-checked", "true");
		expect(switches[1]).toHaveAttribute("aria-checked", "false");
		expect(switches[2]).toHaveAttribute("aria-checked", "true");
		expect(screen.getByText("Only takes effect while new-panel is on.")).toBeInTheDocument();
		expect(screen.getByText("On, waiting for new-panel")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");

		fireEvent.click(screen.getByRole("switch", { name: "Turn new-panel off" }));
		expect(toggle).toHaveBeenCalledWith(ROW);
	});

	it("locks the switch being saved and shows a failed switch", () => {
		mockRules.mockReturnValue(
			rulesWith({ pendingKey: "new-panel", errorMessage: "We couldn't switch quiet." }),
		);
		renderWithMessages(<FeatureFlagsScreen />);

		expect(screen.getByRole("switch", { name: "Turn new-panel off" })).toBeDisabled();
		expect(screen.getByRole("alert")).toHaveTextContent("We couldn't switch quiet.");
	});

	it("shows the empty, loading and error states", () => {
		mockRules.mockReturnValue(rulesWith({ rows: [] }));
		const { rerender } = renderWithMessages(<FeatureFlagsScreen />);
		expect(screen.getByText(EN_MESSAGES.featureFlags.empty)).toBeInTheDocument();

		mockRules.mockReturnValue(rulesWith({ status: "loading" }));
		rerender(<FeatureFlagsScreen />);
		expect(screen.getByTestId("feature-flags-skeleton")).toBeInTheDocument();

		mockRules.mockReturnValue(rulesWith({ status: "error" }));
		rerender(<FeatureFlagsScreen />);
		expect(screen.getByRole("alert")).toHaveTextContent(EN_MESSAGES.featureFlags.failed);
	});
});
