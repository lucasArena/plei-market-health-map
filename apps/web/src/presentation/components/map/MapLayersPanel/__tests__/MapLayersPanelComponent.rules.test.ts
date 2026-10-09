import { getMessages } from "@market-health-map/core/i18n";
import { act, renderHook } from "@testing-library/react";
import { useMapLayersPanelRules } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.rules";

const setDemandMetric = vi.fn();
const setSupplyMetric = vi.fn();
const setSessionFilters = vi.fn();
const setDemandFiltersPresent = vi.fn();
const setShowGamesTrend = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
}));

vi.mock("@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context", () => ({
	useMapLayers: () => ({
		demandMetric: "sessions",
		supplyMetric: "games",
		setDemandMetric,
		setSupplyMetric,
		setSessionFilters,
		setDemandFiltersPresent,
		showSessions: true,
		showActiveFacilities: true,
		showInactiveFacilities: false,
		showGamesTrend: false,
		setShowGamesTrend,
		gameDepartments: [],
		sessionFilters: {},
	}),
}));

vi.mock("@/presentation/components/providers/MessagesProvider/MessagesProviderComponent", () => ({
	useMessages: () => ({ messages: getMessages("en") }),
}));

vi.mock("@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference", () => ({
	layersPanelPreference: { remember: vi.fn(), isOpen: () => false },
}));

vi.mock("@/presentation/hooks/use-map/use-reveal-motion", () => ({
	useRevealMotion: () => ({
		finishReveal: vi.fn(),
		isShown: true,
		motion: "shown",
	}),
}));

beforeEach(() => {
	setDemandMetric.mockClear();
	setSupplyMetric.mockClear();
	setSessionFilters.mockClear();
	setShowGamesTrend.mockClear();
});

it("selects registrations on demand", () => {
	const { result } = renderHook(() => useMapLayersPanelRules());
	act(() => result.current.selectDemandMetric("registrations"));
	expect(setDemandMetric).toHaveBeenCalledWith("registrations");
});

it("selects games on supply", () => {
	const { result } = renderHook(() => useMapLayersPanelRules());
	act(() => result.current.selectSupplyMetric("games"));
	expect(setSupplyMetric).toHaveBeenCalledWith("games");
});

it("leaves the applied layers alone when it mounts", () => {
	renderHook(() => useMapLayersPanelRules());
	expect(setSessionFilters).not.toHaveBeenCalled();
	expect(setDemandMetric).not.toHaveBeenCalled();
	expect(setShowGamesTrend).not.toHaveBeenCalled();
});

it("maps unknown demand metrics back to sessions", () => {
	const { result } = renderHook(() => useMapLayersPanelRules());
	act(() => result.current.selectDemandMetric("other"));
	expect(setDemandMetric).toHaveBeenCalledWith("sessions");
});

it("maps unknown supply metrics back to facilities", () => {
	const { result } = renderHook(() => useMapLayersPanelRules());
	act(() => result.current.selectSupplyMetric("other"));
	expect(setSupplyMetric).toHaveBeenCalledWith("facilities");
});

it("closes the panel from Escape", () => {
	const { result } = renderHook(() => useMapLayersPanelRules());
	act(() => result.current.toggleExpanded());
	expect(result.current.isExpanded).toBe(true);
	act(() =>
		result.current.closeOnEscape({
			key: "Escape",
		} as never),
	);
	expect(result.current.isExpanded).toBe(false);
});
