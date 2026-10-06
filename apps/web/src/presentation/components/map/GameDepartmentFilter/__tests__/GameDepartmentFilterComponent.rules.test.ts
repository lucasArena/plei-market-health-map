import { getMessages } from "@market-health-map/core/i18n";
import { act, renderHook } from "@testing-library/react";
import { useGameDepartmentFilterRules } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.rules";

const setGameDepartments = vi.fn();
const layers = {
	gameDepartments: [] as string[],
	setGameDepartments,
	setSupplyFiltersPresent: vi.fn(),
};

vi.mock("@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context", () => ({
	useMapLayers: () => layers,
}));

vi.mock("@/presentation/components/providers/MessagesProvider/MessagesProviderComponent", () => ({
	useMessages: () => ({ messages: getMessages("en") }),
}));

beforeEach(() => {
	setGameDepartments.mockClear();
	layers.gameDepartments = [];
});

it("ignores Escape when the add menu is closed", () => {
	const { result } = renderHook(() => useGameDepartmentFilterRules(true));
	const stopPropagation = vi.fn();
	act(() =>
		result.current.handleKeys({
			key: "Escape",
			stopPropagation,
			preventDefault: vi.fn(),
		} as never),
	);
	expect(stopPropagation).not.toHaveBeenCalled();
});

it("does not apply when the draft matches the applied selection", () => {
	const { result } = renderHook(() => useGameDepartmentFilterRules(true));
	act(() => result.current.apply());
	expect(setGameDepartments).not.toHaveBeenCalled();
});

it("ignores department toggles while disabled", () => {
	const { result } = renderHook(() => useGameDepartmentFilterRules(false));
	act(() => result.current.toggleOption("magic"));
	expect(result.current.isSelected("magic")).toBe(false);
});

it("applies a staged department selection", () => {
	const { result } = renderHook(() => useGameDepartmentFilterRules(true));
	act(() => {
		result.current.toggleAdd();
		result.current.toggleDepartment();
		result.current.toggleOption("magic");
	});
	act(() => result.current.apply());
	expect(setGameDepartments).toHaveBeenCalledWith(["magic"]);
});

it("removes an applied department chip", () => {
	layers.gameDepartments = ["magic"];
	const { result } = renderHook(() => useGameDepartmentFilterRules(true));
	act(() => result.current.removeDepartment("magic"));
	expect(setGameDepartments).toHaveBeenCalledWith([]);
});

it("deselects a staged department before apply", () => {
	const { result } = renderHook(() => useGameDepartmentFilterRules(true));
	act(() => {
		result.current.toggleOption("magic");
		result.current.toggleOption("magic");
	});
	expect(result.current.isSelected("magic")).toBe(false);
});

it("closes the add menu and clears the department submenu", () => {
	const { result } = renderHook(() => useGameDepartmentFilterRules(true));
	act(() => {
		result.current.toggleAdd();
		result.current.toggleDepartment();
		result.current.toggleAdd();
	});
	expect(result.current.addOpen).toBe(false);
	expect(result.current.departmentOpen).toBe(false);
});
