import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MapLayersPanel } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

afterEach(() => {
	vi.useRealTimers();
});

function switchByName(name: string) {
	return screen.getByRole("switch", { name });
}

describe("MapLayersPanel", () => {
	it("opens at the top left with facilities off", () => {
		renderWithMessages(<MapLayersPanel />);

		const panel = screen.getByRole("complementary", { name: "Plei Market" });
		expect(panel).toHaveClass(
			"fixed",
			"top-[20px]",
			"left-[20px]",
			"z-50",
			"gap-[4px]",
			"items-stretch",
		);
		const layersCard = screen.getByText("Layers").parentElement;
		expect(layersCard).toHaveClass("w-full");
		expect(layersCard).not.toHaveClass("w-max");
		expect(panel).not.toHaveClass("border");
		expect(screen.getByText("Plei Market")).toHaveClass("text-[12px]");
		expect(screen.getByText("Plei Market").parentElement).toHaveClass(
			"gap-[4px]",
			"px-[8px]",
			"py-[4px]",
		);
		expect(screen.getByText("Plei Market").parentElement?.parentElement).toHaveClass("py-[2px]");
		expect(switchByName("Facilities")).toHaveClass(
			"bg-[#e5e5e5]",
			"h-[13px]",
			"w-[22px]",
			"p-[1px]",
		);
		expect(switchByName("Facilities").firstElementChild).toHaveClass(
			"size-[9px]",
			"translate-x-0",
			"transition-transform",
		);
		expect(screen.queryByRole("switch", { name: "Users" })).not.toBeInTheDocument();
		expect(screen.queryByText("Users")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Active users" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Active players" })).not.toBeInTheDocument();
		expect(screen.getByText("Layers")).toHaveClass("text-[10px]");
		expect(switchByName("Facilities")).toHaveAttribute("aria-checked", "false");
	});

	it("toggles the facilities layer", () => {
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(switchByName("Facilities"));
		expect(switchByName("Facilities")).toHaveAttribute("aria-checked", "true");
		expect(switchByName("Facilities")).toHaveClass("bg-pleiful-pitch-green-80");
		expect(switchByName("Facilities").firstElementChild).toHaveClass("translate-x-[9px]");
	});

	it("tells the map to show facilities when the switch is turned on", () => {
		function FacilitiesState() {
			const layers = useMapLayers();
			return <span>{String(layers?.showFacilities)}</span>;
		}

		renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
				<FacilitiesState />
			</MapLayersProvider>,
		);

		expect(screen.getByText("false")).toBeInTheDocument();
		fireEvent.click(switchByName("Facilities"));
		expect(screen.getByText("true")).toBeInTheDocument();
		fireEvent.click(switchByName("Facilities"));
		expect(screen.getByText("false")).toBeInTheDocument();
	});

	it("hides the layer list until it is expanded again", () => {
		renderWithMessages(<MapLayersPanel />);

		const toggle = screen.getByRole("button", { name: "Hide layers" });
		expect(toggle).toHaveClass(
			"w-[32px]",
			"-my-[2px]",
			"bg-accent",
			"hover:bg-accent",
			"active:bg-accent",
		);
		expect(toggle.querySelector("img")).toHaveAttribute(
			"src",
			expect.stringContaining("settings-2.svg"),
		);
		expect(toggle.parentElement).not.toHaveTextContent("Layers");

		vi.useFakeTimers();
		fireEvent.click(toggle);

		expect(screen.getByText("Layers").closest(".layers-card-out")).toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(160);
		});

		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
		expect(screen.queryByRole("switch", { name: "Facilities" })).not.toBeInTheDocument();
		const expand = screen.getByRole("button", { name: "Show layers" });
		expect(expand).toHaveClass("bg-card", "hover:bg-accent");
		expect(expand.querySelector("img")).toHaveAttribute(
			"src",
			expect.stringContaining("settings-2.svg"),
		);
		expect(expand.parentElement).not.toHaveClass("border-b");

		fireEvent.click(expand);

		expect(screen.getByText("Layers").closest(".layers-card-in")).toBeInTheDocument();
		expect(screen.getByText("Layers")).toBeInTheDocument();
		expect(switchByName("Facilities")).toHaveAttribute("aria-checked", "false");
	});
});
