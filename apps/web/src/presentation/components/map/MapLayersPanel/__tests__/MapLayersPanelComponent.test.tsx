import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { LAYERS_PANEL_OPEN_KEY } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";
import { MapLayersPanel } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({ usePathname: () => mockPathname() }));

beforeEach(() => {
	localStorage.setItem(LAYERS_PANEL_OPEN_KEY, "true");
});

afterEach(() => {
	vi.useRealTimers();
	localStorage.clear();
});

function switchByName(name: string) {
	return screen.getByRole("switch", { name });
}

describe("MapLayersPanel", () => {
	it("sits beside the centered search with Demand and Supply on glass", () => {
		renderWithMessages(<MapLayersPanel />);

		const panel = screen.getByRole("complementary", { name: "Layers" });
		expect(panel).toHaveClass(
			"fixed",
			"top-[var(--map-frame)]",
			"left-[calc(50%+min(12rem,50%-12rem)+4px)]",
			"z-50",
			"w-[32px]",
		);
		const layersCard = screen.getByText("Layers").parentElement;
		expect(layersCard).toHaveClass(
			"map-glass",
			"right-0",
			"w-max",
			"shadow-[var(--map-shadow)]",
			"search-results-in",
		);
		expect(layersCard).not.toHaveClass("left-0", "inset-x-0");
		expect(panel).not.toHaveClass("border");
		expect(screen.queryByRole("link", { name: "Market Health Map" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Hide layers" })).toHaveClass(
			"size-[32px]",
			"map-glass",
			"map-icon-button",
			"text-map-icon",
		);
		expect(switchByName("Active facilities")).toHaveClass(
			"bg-pleiful-pitch-green-80",
			"h-[13px]",
			"w-[22px]",
			"p-[1px]",
		);
		expect(switchByName("Active facilities").firstElementChild).toHaveClass(
			"size-[9px]",
			"translate-x-[9px]",
			"transition-transform",
		);
		expect(screen.queryByRole("switch", { name: "Users" })).not.toBeInTheDocument();
		expect(screen.queryByText("Users")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Active users" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Active players" })).not.toBeInTheDocument();
		expect(screen.getByText("Layers")).toHaveClass("px-2", "py-1.5", "text-xs", "uppercase");
		expect(screen.getByText("Demand")).toBeInTheDocument();
		expect(screen.getByText("Supply")).toBeInTheDocument();
		expect(switchByName("Active facilities")).toHaveAttribute("aria-checked", "true");
		expect(screen.getByText("Active facilities").previousElementSibling).toBeNull();
		expect(switchByName("Inactive facilities")).toHaveAttribute("aria-checked", "true");
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
	});

	it("toggles inactive facilities independently", () => {
		renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
			</MapLayersProvider>,
		);
		fireEvent.click(switchByName("Inactive facilities"));
		expect(switchByName("Inactive facilities")).toHaveAttribute("aria-checked", "false");
		expect(switchByName("Active facilities")).toHaveAttribute("aria-checked", "true");
		fireEvent.click(switchByName("Active facilities"));
		expect(switchByName("Active facilities")).toHaveAttribute("aria-checked", "false");
		fireEvent.click(switchByName("Inactive facilities"));
		expect(switchByName("Inactive facilities")).toHaveAttribute("aria-checked", "true");
	});

	it("toggles inactive facilities without a provider", () => {
		renderWithMessages(<MapLayersPanel />);
		fireEvent.click(switchByName("Inactive facilities"));
		expect(switchByName("Inactive facilities")).toHaveAttribute("aria-checked", "false");
	});

	it("toggles the facilities layer", () => {
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(switchByName("Active facilities"));
		expect(switchByName("Active facilities")).toHaveAttribute("aria-checked", "false");
		expect(switchByName("Active facilities")).toHaveClass("bg-[#e5e5e5]");
		expect(switchByName("Active facilities").firstElementChild).toHaveClass("translate-x-0");
		fireEvent.click(switchByName("App sessions"));
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "false");
		fireEvent.click(switchByName("App sessions"));
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
	});

	it("tells the map to hide and show facilities with the switch", () => {
		function FacilitiesState() {
			const layers = useMapLayers();
			return <span>{String(layers?.showActiveFacilities)}</span>;
		}

		renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
				<FacilitiesState />
			</MapLayersProvider>,
		);

		expect(screen.getByText("true")).toBeInTheDocument();
		fireEvent.click(switchByName("Active facilities"));
		expect(screen.getByText("false")).toBeInTheDocument();
		fireEvent.click(switchByName("Active facilities"));
		expect(screen.getByText("true")).toBeInTheDocument();
	});

	it("tells the map to hide app sessions when the switch is turned off", () => {
		function SessionsState() {
			const layers = useMapLayers();
			return <span>{`sessions:${String(layers?.showSessions)}`}</span>;
		}

		renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
				<SessionsState />
			</MapLayersProvider>,
		);

		expect(screen.getByText("sessions:true")).toBeInTheDocument();
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
		fireEvent.click(switchByName("App sessions"));
		expect(screen.getByText("sessions:false")).toBeInTheDocument();
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "false");
		fireEvent.click(switchByName("App sessions"));
		expect(screen.getByText("sessions:true")).toBeInTheDocument();
	});

	it("hides the layer list until it is expanded again", () => {
		renderWithMessages(<MapLayersPanel />);

		const toggle = screen.getByRole("button", { name: "Hide layers" });
		expect(toggle).toHaveClass("size-[32px]", "rounded-full", "map-glass", "map-icon-button");
		expect(toggle.querySelector("img")).toHaveAttribute(
			"src",
			expect.stringContaining("settings-2.svg"),
		);
		expect(toggle).not.toHaveTextContent("Layers");

		vi.useFakeTimers();
		fireEvent.click(toggle);

		expect(screen.getByText("Layers").closest(".search-results-out")).toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(160);
		});

		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
		expect(screen.queryByRole("switch", { name: "Active facilities" })).not.toBeInTheDocument();
		const expand = screen.getByRole("button", { name: "Show layers" });
		expect(expand).toHaveClass("map-glass", "map-icon-button", "rounded-full");
		expect(expand.querySelector("img")).toHaveAttribute(
			"src",
			expect.stringContaining("settings-2.svg"),
		);
		expect(expand.parentElement).not.toHaveClass("border-b");

		fireEvent.click(expand);

		expect(screen.getByText("Layers").closest(".search-results-in")).toBeInTheDocument();
		expect(screen.getByText("Layers")).toBeInTheDocument();
		expect(switchByName("Active facilities")).toHaveAttribute("aria-checked", "true");
	});

	it("hides the layers control away from the map", () => {
		mockPathname.mockReturnValue("/metrics");
		renderWithMessages(<MapLayersPanel />);

		expect(screen.queryByRole("switch")).not.toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		fireEvent.pointerDown(document.body);
		mockPathname.mockReturnValue("/");
	});

	it("closes from Escape and an outside pointer the way search does", () => {
		vi.useFakeTimers();
		renderWithMessages(<MapLayersPanel />);
		const toggle = screen.getByRole("button", { name: "Hide layers" });

		fireEvent.keyDown(toggle, { key: "ArrowDown" });
		expect(screen.getByText("Layers")).toBeInTheDocument();
		fireEvent.pointerDown(toggle);
		expect(screen.getByText("Layers")).toBeInTheDocument();

		fireEvent.keyDown(toggle, { key: "Escape" });
		expect(screen.getByText("Layers").closest(".search-results-out")).toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(160);
		});
		expect(screen.queryByText("Layers")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Show layers" }));
		expect(screen.getByText("Layers")).toBeInTheDocument();
		fireEvent.pointerDown(document.body);
		expect(screen.getByText("Layers").closest(".search-results-out")).toBeInTheDocument();
	});

	it("starts collapsed when the person never left it open", () => {
		localStorage.clear();
		renderWithMessages(<MapLayersPanel />);

		expect(screen.getByRole("button", { name: "Show layers" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
		expect(screen.queryByTestId("layers-badge")).not.toBeInTheDocument();
	});

	it("remembers whether the panel was left open or closed", () => {
		localStorage.clear();
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(screen.getByRole("button", { name: "Show layers" }));
		expect(localStorage.getItem(LAYERS_PANEL_OPEN_KEY)).toBe("true");
		fireEvent.click(screen.getByRole("button", { name: "Hide layers" }));
		expect(localStorage.getItem(LAYERS_PANEL_OPEN_KEY)).toBe("false");
	});

	it("badges the button with the layers that are on only when some are off", () => {
		renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
			</MapLayersProvider>,
		);
		const button = screen.getByRole("button", { name: "Hide layers" });
		expect(screen.queryByTestId("layers-badge")).not.toBeInTheDocument();
		expect(button).not.toHaveAttribute("aria-describedby");

		fireEvent.click(switchByName("App sessions"));
		expect(screen.getByTestId("layers-badge")).toHaveTextContent("2");
		expect(button).toHaveAccessibleDescription("2 of 3 layers on");
		expect(screen.getByTestId("layers-badge")).toHaveClass("absolute", "-top-1", "-right-1");

		fireEvent.click(switchByName("Active facilities"));
		expect(screen.getByTestId("layers-badge")).toHaveTextContent("1");
		fireEvent.click(switchByName("App sessions"));
		fireEvent.click(switchByName("Active facilities"));
		expect(screen.queryByTestId("layers-badge")).not.toBeInTheDocument();
	});
});
