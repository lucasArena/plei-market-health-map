import { edgeTooltipClass } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent.rules";

describe("edgeTooltipClass", () => {
	it("keeps edge tooltips inside the panel", () => {
		expect(edgeTooltipClass(0, 7)).toBe("left-0 translate-x-0");
		expect(edgeTooltipClass(3, 7)).toBe("left-1/2 -translate-x-1/2");
		expect(edgeTooltipClass(6, 7)).toBe("right-0 left-auto translate-x-0");
		expect(edgeTooltipClass(0, 1)).toBe("left-0 translate-x-0");
	});
});
