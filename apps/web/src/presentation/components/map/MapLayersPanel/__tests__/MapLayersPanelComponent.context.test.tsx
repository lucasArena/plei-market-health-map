import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

const KEY = "market-health-map:map-filters";

function wrapper({ children }: { children: ReactNode }) {
	return <MapLayersProvider>{children}</MapLayersProvider>;
}

function stored() {
	return JSON.parse(localStorage.getItem(KEY) ?? "null");
}

describe("MapLayersProvider", () => {
	beforeEach(() => localStorage.clear());

	it("restores the filters saved in this browser", () => {
		localStorage.setItem(
			KEY,
			JSON.stringify({
				showActiveFacilities: true,
				showInactiveFacilities: true,
				showGamesTrend: true,
				showSessions: false,
				demandMetric: "registrations",
				supplyMetric: "facilities",
				gameDepartments: ["magic", "organizers"],
				demandFiltersPresent: true,
				supplyFiltersPresent: true,
				sessionFilters: { gender: ["female"], ageMin: 21 },
			}),
		);

		const { result } = renderHook(() => useMapLayers(), { wrapper });

		expect(result.current).toMatchObject({
			showInactiveFacilities: true,
			showGamesTrend: true,
			showSessions: false,
			demandMetric: "registrations",
			supplyMetric: "facilities",
			gameDepartments: ["magic", "organizers"],
			demandFiltersPresent: true,
			sessionFilters: { gender: ["female"], ageMin: 21 },
		});
	});

	it("saves every change and keeps the defaults when nothing valid is stored", () => {
		localStorage.setItem(KEY, JSON.stringify({ supplyMetric: "players" }));
		const { result } = renderHook(() => useMapLayers(), { wrapper });

		expect(result.current?.supplyMetric).toBe("games");
		act(() => result.current?.setGameDepartments?.(["partnerships"]));
		act(() => result.current?.setSessionFilters({ skill: "Advanced" }));

		expect(stored()).toMatchObject({
			gameDepartments: ["partnerships"],
			sessionFilters: { skill: "Advanced" },
			supplyMetric: "games",
		});

		act(() => result.current?.resetLayers());
		expect(stored()).toMatchObject({ gameDepartments: [], sessionFilters: {} });
	});
});
