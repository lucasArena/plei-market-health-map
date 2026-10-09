import { gamesTrend } from "@market-health-map/core/domain";
import { EN_MESSAGES } from "@/application/test/messages";
import { formatGamesTrendPanel } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	formatGamesChange,
	formatGamesTrend,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.rules";

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
});
