import type { GameDepartment } from "@market-health-map/core/domain";
import { renderHook } from "@testing-library/react";
import { useMarketSummaryFilters } from "@/presentation/hooks/use-market/use-market-summary-filters";

let mockLayers: { gameDepartments: GameDepartment[] } | null = null;

vi.mock("@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context", () => ({
	useMapLayers: () => mockLayers,
}));

describe("useMarketSummaryFilters", () => {
	beforeEach(() => {
		mockLayers = null;
	});

	it("follows the map's department filter in one canonical order", () => {
		mockLayers = { gameDepartments: ["partnerships", "magic"] };

		const { result } = renderHook(() => useMarketSummaryFilters());

		expect(result.current).toEqual({ departments: ["magic", "partnerships"] });
	});

	it("has no department filter outside the layers provider", () => {
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
