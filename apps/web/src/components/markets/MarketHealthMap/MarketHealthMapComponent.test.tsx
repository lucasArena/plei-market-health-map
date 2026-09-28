import { fireEvent, render, screen } from "@testing-library/react";
import { MarketHealthMap } from "@/components/markets/MarketHealthMap/MarketHealthMapComponent";
import {
	buildLegend,
	buildMetricOptions,
} from "@/components/markets/MarketHealthMap/MarketHealthMapComponent.rules";
import { EN_MESSAGES } from "@/test/messages";

const mockRules = vi.fn();
const mockSetMetric = vi.fn();
const mockCloseDetail = vi.fn();

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@/components/markets/MarketDetailPanel/MarketDetailPanelComponent", () => ({
	MarketDetailPanel: ({ marketId, onClose }: { marketId: string; onClose: () => void }) => (
		<button type="button" onClick={onClose}>
			detail:{marketId}
		</button>
	),
}));
vi.mock(
	"@/components/markets/MarketHealthMap/MarketHealthMapComponent.rules",
	async (importOriginal) => ({
		...(await importOriginal<object>()),
		useMarketHealthMapRules: () => mockRules(),
	}),
);

function rulesWith(status: string, selectedMarketId: string | null = null) {
	return {
		closeDetail: mockCloseDetail,
		selectedMarketId,
		containerRef: { current: null },
		legend: buildLegend(EN_MESSAGES.map),
		messages: EN_MESSAGES.map,
		metric: "healthScore",
		metricOptions: buildMetricOptions(EN_MESSAGES.map),
		setMetric: mockSetMetric,
		status,
	};
}

describe("MarketHealthMap", () => {
	beforeEach(() => vi.clearAllMocks());

	it("renders the map, metric toggles and legend", () => {
		mockRules.mockReturnValue(rulesWith("ready"));

		render(<MarketHealthMap />);

		expect(screen.getByRole("region", { name: "Market health" })).toHaveAttribute(
			"data-panel-open",
			"false",
		);
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		expect(screen.getByRole("list", { name: "Map legend" })).toBeInTheDocument();
		expect(screen.getByTestId("market-map")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Health score" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByText("At risk")).toBeInTheDocument();
		expect(screen.getByText(EN_MESSAGES.map.sampleNotice)).toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("opens the detail panel for the selected market", () => {
		mockRules.mockReturnValue(rulesWith("ready", "sample-austin"));

		render(<MarketHealthMap />);
		expect(screen.getByRole("region", { name: "Market health" })).toHaveAttribute(
			"data-panel-open",
			"true",
		);
		fireEvent.click(screen.getByRole("button", { name: "detail:sample-austin" }));

		expect(mockCloseDetail).toHaveBeenCalled();
	});

	it("switches the heat metric", () => {
		mockRules.mockReturnValue(rulesWith("ready"));

		render(<MarketHealthMap />);
		fireEvent.click(screen.getByRole("button", { name: "Active players" }));

		expect(mockSetMetric).toHaveBeenCalledWith("activePlayers");
	});

	it.each([
		["loading", EN_MESSAGES.map.loading],
		["error", EN_MESSAGES.map.failed],
	])("shows the %s overlay", (status, text) => {
		mockRules.mockReturnValue(rulesWith(status));

		render(<MarketHealthMap />);

		expect(screen.getByRole("status")).toHaveTextContent(text);
	});
});
