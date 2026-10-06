import { getMessages } from "@market-health-map/core/i18n";
import { act, renderHook } from "@testing-library/react";
import { useAppSessionFiltersRules } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.rules";

const setSessionFilters = vi.fn();
const layers = {
	sessionFilters: {},
	setSessionFilters,
	setDemandFiltersPresent: vi.fn(),
};

vi.mock("@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context", () => ({
	useMapLayers: () => layers,
}));

vi.mock("@/presentation/hooks/use-app/use-app-session-heatmap", () => ({
	useAppSessionFilterOptions: () => ({
		data: { genders: ["Female"], skills: ["Beginner"] },
	}),
}));

vi.mock("@/presentation/components/providers/MessagesProvider/MessagesProviderComponent", () => ({
	useMessages: () => ({ messages: getMessages("en") }),
}));

beforeEach(() => {
	setSessionFilters.mockClear();
	layers.sessionFilters = {};
});

it("does not apply filters when nothing changed", () => {
	const { result } = renderHook(() => useAppSessionFiltersRules(true));
	act(() => result.current.applyFilters());
	expect(setSessionFilters).not.toHaveBeenCalled();
});

it("ignores option toggles while sessions are hidden", () => {
	const { result } = renderHook(() => useAppSessionFiltersRules(false));
	act(() => result.current.toggleOption("gender", "female"));
	expect(result.current.isSelected("gender", "female")).toBe(false);
});

it("ignores unknown filter option ids", () => {
	const { result } = renderHook(() => useAppSessionFiltersRules(true));
	act(() => result.current.toggleOption("gender", "missing"));
	expect(result.current.isSelected("gender", "missing")).toBe(false);
});

it("removes an age filter in one step", () => {
	layers.sessionFilters = { ageMin: 18, ageMax: 24 };
	const { result } = renderHook(() => useAppSessionFiltersRules(true));
	act(() => result.current.removeOption("age", "age"));
	expect(setSessionFilters).toHaveBeenCalledWith({});
});

it("stages and applies a gender filter", () => {
	const onApplied = vi.fn();
	const { result } = renderHook(() => useAppSessionFiltersRules(true, onApplied));
	act(() => {
		result.current.toggleAdd();
		result.current.toggleOption("gender", "female");
	});
	act(() => result.current.applyFilters());
	expect(setSessionFilters).toHaveBeenCalledWith({ gender: ["Female"] });
	expect(onApplied).toHaveBeenCalled();
});

it("removes an applied gender filter", () => {
	layers.sessionFilters = { gender: ["Female"] };
	const { result } = renderHook(() => useAppSessionFiltersRules(true));
	act(() => result.current.removeOption("gender", "female"));
	expect(setSessionFilters).toHaveBeenCalledWith({});
});

it("removes an applied skill filter", () => {
	layers.sessionFilters = { skill: ["Beginner"] };
	const { result } = renderHook(() => useAppSessionFiltersRules(true));
	act(() => result.current.removeOption("skill", "beginner"));
	expect(setSessionFilters).toHaveBeenCalledWith({});
});

it("ignores Escape when the add menu is closed", () => {
	const { result } = renderHook(() => useAppSessionFiltersRules(true));
	const stopPropagation = vi.fn();
	const preventDefault = vi.fn();
	act(() =>
		result.current.handleKeys({
			key: "Escape",
			stopPropagation,
			preventDefault,
		} as never),
	);
	expect(stopPropagation).not.toHaveBeenCalled();
});
