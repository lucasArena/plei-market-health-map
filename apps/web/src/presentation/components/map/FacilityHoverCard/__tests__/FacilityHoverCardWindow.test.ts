import { gamesTrend } from "@market-health-map/core/domain";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	createDetailFormatters,
	formatGamesTrendPanel,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	formatGamesChange,
	formatGamesTrend,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.rules";
import { buildFeatureFlagRows } from "@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent.rules";

vi.mock("@market-health-map/core/domain", async (importOriginal) => ({
	...(await importOriginal<object>()),
	GAMES_WINDOW_DAYS: 7,
}));

describe("shared games window copy", () => {
	it.each([
		[11, 10],
		[9, 10],
		[10, 10],
		[1, 0],
	] as const)("uses seven days in hover and details for %s versus %s", (current, previous) => {
		const trend = gamesTrend(current, previous);
		const messages = EN_MESSAGES.map.trend;
		expect(formatGamesChange(trend, messages)).toContain("7 days");
		expect(formatGamesTrend(trend, messages)).toContain("7 days");
		const panel = formatGamesTrendPanel(trend, messages);
		expect(panel.compare).toContain("7 days");
		expect(panel.change).toContain("7 days");
	});
	it("uses seven days in the trend feature flag description", () => {
		const rows = buildFeatureFlagRows(
			[{ key: "facility-games-trend", enabled: false, updatedAt: null, updatedBy: null }],
			EN_MESSAGES.featureFlags,
			createDetailFormatters("en"),
		);
		expect(rows[0]?.description).toContain("7 days");
	});
});
