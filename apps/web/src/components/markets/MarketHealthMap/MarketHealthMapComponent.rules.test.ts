import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagesProvider } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	buildLegend,
	buildMetricOptions,
	resolveMapStatus,
	toMarketFeatureCollection,
	useMarketHealthMapRules,
} from "@/components/markets/MarketHealthMap/MarketHealthMapComponent.rules";
import { CIRCLE_LAYER_ID } from "@/components/markets/MarketHealthMap/MarketHealthMapComponent.styles";
import { EN_MESSAGES } from "@/test/messages";

const mapState = vi.hoisted(() => ({
	instances: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
	handlers: new Map<string, (...args: unknown[]) => unknown>(),
	popups: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
	canvas: { style: { cursor: "" } },
	setData: vi.fn(),
}));

vi.mock("maplibre-gl", () => {
	class MockMap {
		addControl = vi.fn();
		addSource = vi.fn();
		addLayer = vi.fn();
		remove = vi.fn();
		easeTo = vi.fn();
		setPaintProperty = vi.fn();
		off = vi.fn();
		getCanvas = vi.fn(() => mapState.canvas);
		getSource = vi.fn(() => ({ setData: mapState.setData }));
		on = vi.fn((event: string, layerOrHandler: unknown, handler?: unknown) => {
			const key = handler ? `${event}:${String(layerOrHandler)}` : event;
			mapState.handlers.set(key, (handler ?? layerOrHandler) as (...args: unknown[]) => unknown);
		});
		constructor(public options: unknown) {
			mapState.instances.push(this as unknown as Record<string, ReturnType<typeof vi.fn>>);
		}
	}
	class MockNavigationControl {}
	return { Map: MockMap, NavigationControl: MockNavigationControl };
});

const mockUseMarketHealth = vi.fn();

vi.mock("@/lib/api/use-market-health", () => ({ useMarketHealth: () => mockUseMarketHealth() }));

const AUSTIN = {
	id: "austin",
	name: "Austin",
	state: "Texas",
	country: "USA",
	currency: "USD",
	location: { latitude: 30.27, longitude: -97.74 },
	metrics: { activePlayers: 4000, gamesLastWeek: 600, facilities: 30, healthScore: 88 },
	healthStatus: "healthy" as const,
};
const TAMPA = {
	...AUSTIN,
	id: "tampa",
	name: "Tampa",
	state: "FL",
	metrics: { activePlayers: 1000, gamesLastWeek: 150, facilities: 12, healthScore: 37 },
	healthStatus: "at-risk" as const,
};

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

function renderRules() {
	const container = document.createElement("div");
	return renderHook(
		() => {
			const rules = useMarketHealthMapRules();
			rules.containerRef.current ??= container;
			return rules;
		},
		{ wrapper },
	);
}

describe("toMarketFeatureCollection", () => {
	it("builds GeoJSON points weighted by the selected metric", () => {
		const collection = toMarketFeatureCollection([AUSTIN, TAMPA], "activePlayers");

		expect(collection.features[0]?.geometry.coordinates).toEqual([-97.74, 30.27]);
		expect(collection.features.map((feature) => feature.properties.weight)).toEqual([1, 0.25]);
		expect(collection.features[1]?.properties).toMatchObject({
			name: "Tampa",
			healthStatus: "at-risk",
		});
	});

	it("avoids dividing by zero when every value is zero", () => {
		const empty = { ...AUSTIN, metrics: { ...AUSTIN.metrics, facilities: 0 } };
		expect(toMarketFeatureCollection([empty], "facilities").features[0]?.properties.weight).toBe(0);
	});
});

describe("builders", () => {
	it("labels every metric and status", () => {
		expect(buildMetricOptions(EN_MESSAGES.map).map((option) => option.label)).toEqual([
			"Health score",
			"Active players",
			"Games last week",
			"Facilities",
		]);
		expect(buildLegend(EN_MESSAGES.map).map((item) => item.label)).toEqual([
			"Healthy",
			"Watch",
			"At risk",
			"No facilities",
		]);
	});
});

describe("resolveMapStatus", () => {
	it("maps query state to a map status", () => {
		expect(resolveMapStatus(true, false)).toBe("loading");
		expect(resolveMapStatus(false, true)).toBe("error");
		expect(resolveMapStatus(false, false)).toBe("ready");
	});
});

describe("useMarketHealthMapRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mapState.instances.length = 0;
		mapState.handlers.clear();
		mapState.canvas.style.cursor = "";
		mockUseMarketHealth.mockReturnValue({
			data: [AUSTIN, TAMPA],
			isPending: false,
			isError: false,
		});
	});

	it("creates the map, adds layers on load and pushes market data", async () => {
		const { result } = renderRules();

		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];
		act(() => {
			mapState.handlers.get("load")?.();
		});

		expect(map?.addSource).toHaveBeenCalledWith("markets", expect.anything());
		expect(map?.addLayer).toHaveBeenCalledTimes(2);
		await waitFor(() => expect(mapState.setData).toHaveBeenCalled());
		expect(result.current.status).toBe("ready");
	});

	it("re-weights the heat when the metric changes", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => {
			mapState.handlers.get("load")?.();
		});

		act(() => result.current.setMetric("facilities"));

		await waitFor(() =>
			expect(mapState.setData).toHaveBeenLastCalledWith(
				expect.objectContaining({
					features: expect.arrayContaining([
						expect.objectContaining({ properties: expect.objectContaining({ weight: 0.4 }) }),
					]),
				}),
			),
		);
		expect(result.current.metric).toBe("facilities");
	});

	it("selects a market on click, highlights it and closes the detail", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => {
			mapState.handlers.get("load")?.();
		});
		await waitFor(() => expect(mapState.handlers.has(`click:${CIRCLE_LAYER_ID}`)).toBe(true));
		const map = mapState.instances[0];

		mapState.handlers.get(`mouseenter:${CIRCLE_LAYER_ID}`)?.();
		expect(mapState.canvas.style.cursor).toBe("pointer");
		mapState.handlers.get(`mouseleave:${CIRCLE_LAYER_ID}`)?.();
		expect(mapState.canvas.style.cursor).toBe("");

		const [feature] = toMarketFeatureCollection([AUSTIN], "healthScore").features;
		act(() => {
			mapState.handlers.get(`click:${CIRCLE_LAYER_ID}`)?.({
				features: [feature],
				lngLat: { lng: -97.74, lat: 30.27 },
			});
		});

		expect(result.current.selectedMarketId).toBe("austin");
		expect(map?.easeTo).toHaveBeenCalledWith(
			expect.objectContaining({ padding: expect.objectContaining({ right: 400 }) }),
		);
		await waitFor(() =>
			expect(map?.setPaintProperty).toHaveBeenCalledWith(CIRCLE_LAYER_ID, "circle-stroke-width", [
				"case",
				["==", ["get", "id"], "austin"],
				4,
				1.5,
			]),
		);

		act(() => {
			mapState.handlers.get(`click:${CIRCLE_LAYER_ID}`)?.({ features: [] });
		});
		expect(result.current.selectedMarketId).toBe("austin");

		act(() => result.current.closeDetail());
		expect(result.current.selectedMarketId).toBeNull();
		expect(map?.easeTo).toHaveBeenLastCalledWith(
			expect.objectContaining({ padding: expect.objectContaining({ right: 0 }) }),
		);
	});

	it("removes the map and listeners on unmount", async () => {
		const { unmount } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => {
			mapState.handlers.get("load")?.();
		});
		const map = mapState.instances[0];

		unmount();

		expect(map?.off).toHaveBeenCalledTimes(3);
		expect(map?.remove).toHaveBeenCalled();
	});

	it("does not create a map when unmounted before maplibre loads", async () => {
		const { unmount } = renderRules();
		unmount();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(mapState.instances).toHaveLength(0);
	});

	it("reports loading while markets are pending", () => {
		mockUseMarketHealth.mockReturnValue({ data: undefined, isPending: true, isError: false });
		const { result } = renderRules();
		expect(result.current.status).toBe("loading");
	});

	it("skips the map when there is no container", () => {
		const { result } = renderHook(() => useMarketHealthMapRules(), { wrapper });
		expect(result.current.containerRef.current).toBeNull();
		expect(mapState.instances).toHaveLength(0);
	});
});
