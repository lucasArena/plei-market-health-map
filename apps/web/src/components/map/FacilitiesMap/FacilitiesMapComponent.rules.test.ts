import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagesProvider } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	resolveMapStatus,
	toFacilityFeatureCollection,
	useFacilitiesMapRules,
} from "@/components/map/FacilitiesMap/FacilitiesMapComponent.rules";
import { FACILITIES_LAYER_ID } from "@/components/map/FacilitiesMap/FacilitiesMapComponent.styles";
import { EN_MESSAGES } from "@/test/messages";

const mapState = vi.hoisted(() => ({
	instances: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
	handlers: new Map<string, (...args: unknown[]) => unknown>(),
	canvas: { style: { cursor: "" } },
	setData: vi.fn(),
	setWorkerUrl: vi.fn(),
}));

vi.mock("maplibre-gl", () => {
	class MockMap {
		addControl = vi.fn();
		addSource = vi.fn();
		addLayer = vi.fn();
		remove = vi.fn();
		off = vi.fn();
		easeTo = vi.fn();
		setPaintProperty = vi.fn();
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
	return {
		Map: MockMap,
		NavigationControl: MockNavigationControl,
		setWorkerUrl: mapState.setWorkerUrl,
	};
});

const mockUseFacilities = vi.fn();

vi.mock("@/lib/api/use-facilities", () => ({ useFacilities: () => mockUseFacilities() }));

const FACILITY = {
	id: "f1",
	marketId: "austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	location: { latitude: 30.27, longitude: -97.74 },
};

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

function renderRules() {
	const container = document.createElement("div");
	return renderHook(
		() => {
			const rules = useFacilitiesMapRules();
			rules.containerRef.current ??= container;
			return rules;
		},
		{ wrapper },
	);
}

describe("toFacilityFeatureCollection", () => {
	it("turns facilities into GeoJSON points", () => {
		expect(toFacilityFeatureCollection([FACILITY])).toEqual({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [-97.74, 30.27] },
					properties: { id: "f1", marketId: "austin", name: "Eastside Futsal Arena" },
				},
			],
		});
	});
});

describe("resolveMapStatus", () => {
	it("maps query state to a status", () => {
		expect(resolveMapStatus(true, false)).toBe("loading");
		expect(resolveMapStatus(false, true)).toBe("error");
		expect(resolveMapStatus(false, false)).toBe("ready");
	});
});

describe("useFacilitiesMapRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mapState.instances.length = 0;
		mapState.handlers.clear();
		mockUseFacilities.mockReturnValue({ data: [FACILITY], isPending: false, isError: false });
	});

	it("creates the map, adds the dot layer on load and pushes the facilities", async () => {
		const { result } = renderRules();

		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];
		act(() => mapState.handlers.get("load")?.());

		expect(mapState.setWorkerUrl).toHaveBeenCalledWith(
			"http://localhost:3000/maplibre/maplibre-gl-worker.mjs",
		);
		expect(map?.addSource).toHaveBeenCalledWith("facilities", expect.anything());
		expect(map?.addLayer).toHaveBeenCalledWith(
			expect.objectContaining({ id: FACILITIES_LAYER_ID, type: "circle" }),
		);
		await waitFor(() =>
			expect(mapState.setData).toHaveBeenCalledWith(
				expect.objectContaining({ features: [expect.objectContaining({ type: "Feature" })] }),
			),
		);
		expect(result.current.status).toBe("ready");
		expect(result.current.messages).toBe(EN_MESSAGES.map);
	});

	it("shows a hover card, opens the panel on click and closes it", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() =>
			expect(mapState.handlers.has(`mousemove:${FACILITIES_LAYER_ID}`)).toBe(true),
		);
		const map = mapState.instances[0];
		const event = (id: unknown) => ({
			features: [{ properties: { id } }],
			point: { x: 120, y: 80 },
		});

		act(() => mapState.handlers.get(`mouseenter:${FACILITIES_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe("pointer");
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		expect(result.current.hovered).toEqual({ facility: FACILITY, x: 120, y: 80 });
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("missing")));
		expect(result.current.hovered).toBeNull();
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get(`mouseleave:${FACILITIES_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe("");
		expect(result.current.hovered).toBeNull();

		act(() => mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.(event(42)));
		expect(result.current.selectedFacility).toBeNull();
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get("movestart")?.());
		expect(result.current.hovered).toBeNull();
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		expect(result.current.selectedFacility).toEqual(FACILITY);
		expect(result.current.hovered).toBeNull();
		expect(map?.easeTo).toHaveBeenCalledWith(
			expect.objectContaining({
				center: [-97.74, 30.27],
				padding: expect.objectContaining({ right: 360 }),
			}),
		);
		await waitFor(() =>
			expect(map?.setPaintProperty).toHaveBeenCalledWith(
				FACILITIES_LAYER_ID,
				"circle-stroke-color",
				["case", ["==", ["get", "id"], "f1"], "#111827", "#ffffff"],
			),
		);

		act(() => result.current.closePanel());
		expect(result.current.selectedFacility).toBeNull();
		expect(map?.easeTo).toHaveBeenLastCalledWith(
			expect.objectContaining({ padding: expect.objectContaining({ right: 0 }) }),
		);
	});

	it("drops a selection whose facility disappears", async () => {
		const { result, rerender } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() => expect(mapState.handlers.has(`click:${FACILITIES_LAYER_ID}`)).toBe(true));
		act(() =>
			mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.({
				features: [{ properties: { id: "f1" } }],
				point: { x: 0, y: 0 },
			}),
		);

		mockUseFacilities.mockReturnValue({ data: [], isPending: false, isError: false });
		rerender();

		expect(result.current.selectedFacility).toBeNull();
	});

	it("removes the map on unmount", async () => {
		const { unmount } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];

		act(() => mapState.handlers.get("load")?.());
		await waitFor(() => expect(mapState.handlers.has(`click:${FACILITIES_LAYER_ID}`)).toBe(true));

		unmount();

		expect(map?.off).toHaveBeenCalledTimes(5);
		expect(map?.remove).toHaveBeenCalled();
	});

	it("does not create a map when unmounted before maplibre loads", async () => {
		const { unmount } = renderRules();
		unmount();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(mapState.instances).toHaveLength(0);
	});

	it("reports loading with no facilities yet", () => {
		mockUseFacilities.mockReturnValue({ data: undefined, isPending: true, isError: false });
		const { result } = renderRules();
		expect(result.current.status).toBe("loading");
	});

	it("skips the map when there is no container", () => {
		renderHook(() => useFacilitiesMapRules(), { wrapper });
		expect(mapState.instances).toHaveLength(0);
	});
});
