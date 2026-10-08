import type { GameDepartment } from "@market-health-map/core/domain";
import { renderHook } from "@testing-library/react";
import { useMarketSummaryFilters } from "@/presentation/hooks/use-market/use-market-summary-filters";

let mockFlagOn = true;
let mockLayers: { gameDepartments: GameDepartment[] } | null = null;

vi.mock("@/presentation/hooks/use-feature-flags/use-feature-flags", () => ({
	useFeatureFlag: () => mockFlagOn,
}));

vi.mock("@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context", () => ({
	useMapLayers: () => mockLayers,
}));

describe("useMarketSummaryFilters", () => {
	beforeEach(() => {
		mockFlagOn = true;
		mockLayers = null;
	});

	it("follows the map's department filter in one canonical order", () => {
		mockLayers = { gameDepartments: ["partnerships", "magic"] };

		const { result } = renderHook(() => useMarketSummaryFilters());

		expect(result.current).toEqual({ departments: ["magic", "partnerships"] });
	});

	it("ignores the filter while the games layer flag is off or outside the layers provider", () => {
		mockLayers = { gameDepartments: ["magic"] };
		mockFlagOn = false;
		expect(renderHook(() => useMarketSummaryFilters()).result.current.departments).toEqual([]);

		mockFlagOn = true;
		mockLayers = null;
		expect(renderHook(() => useMarketSummaryFilters()).result.current.departments).toEqual([]);
	});

	it("keeps the same object while the filter does not change", () => {
		mockLayers = { gameDepartments: ["organizers"] };
		const { result, rerender } = renderHook(() => useMarketSummaryFilters());
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
