import { getMessages } from "@market-health-map/core/i18n";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach } from "vitest";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { LAYERS_PANEL_OPEN_KEY } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";
import { MapLayersPanel } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

vi.mock("@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent", () => ({
	AppSessionFilters: ({ children }: { children?: React.ReactNode }) => children ?? null,
	SessionFilterChips: () => <div>Player filters</div>,
	SessionFilterAdd: () => {
		const layers = useMapLayers();
		if (layers && !layers.showSessions) return null;
		return <button type="button">Add session filter</button>;
	},
	SessionFilterApply: () => null,
}));

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
		const layersCard = screen.getByRole("region", { name: "Demand" }).parentElement;
		expect(layersCard).toHaveClass(
			"map-glass",
			"right-0",
			"w-[280px]",
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
		expect(switchByName("Games")).toHaveClass(
			"bg-pleiful-pitch-green-80",
			"h-[13px]",
			"w-[22px]",
			"p-[1px]",
		);
		expect(switchByName("Games").firstElementChild).toHaveClass(
			"size-[9px]",
			"translate-x-[9px]",
			"transition-transform",
		);
		expect(screen.queryByRole("switch", { name: "Users" })).not.toBeInTheDocument();
		expect(screen.queryByText("Users")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Active users" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Active players" })).not.toBeInTheDocument();
		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
		expect(screen.getByText("Demand")).toHaveClass("text-sm", "font-medium");
		expect(screen.getByText("Supply")).toHaveClass("text-sm", "font-medium");
		expect(screen.getByRole("region", { name: "Demand" }).nextElementSibling).toHaveClass(
			"border-t",
			"border-border",
		);
		expect(screen.getByText("Show trend")).toHaveClass("text-xs");
		expect(switchByName("Games")).toHaveAttribute("aria-checked", "true");
		expect(switchByName("Show trend")).toHaveAttribute("aria-checked", "false");
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
	});

	it("toggles the facilities layer", () => {
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(switchByName("Games"));
		expect(switchByName("Games")).toHaveAttribute("aria-checked", "false");
		expect(switchByName("Games")).toHaveClass("bg-[#e5e5e5]");
		expect(switchByName("Games").firstElementChild).toHaveClass("translate-x-0");
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
		fireEvent.click(switchByName("Games"));
		expect(screen.getByText("false")).toBeInTheDocument();
		fireEvent.click(switchByName("Games"));
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
		expect(toggle.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
		expect(toggle).not.toHaveTextContent("Layers");

		vi.useFakeTimers();
		fireEvent.click(toggle);

		expect(screen.getByText("Demand").closest(".search-results-out")).toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(160);
		});

		expect(screen.queryByText("Demand")).not.toBeInTheDocument();
		expect(screen.queryByRole("switch", { name: "Games" })).not.toBeInTheDocument();
		const expand = screen.getByRole("button", { name: "Show layers" });
		expect(expand).toHaveClass("map-glass", "map-icon-button", "rounded-full");
		expect(expand.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
		expect(expand.parentElement).not.toHaveClass("border-b");

		fireEvent.click(expand);

		expect(screen.getByText("Demand").closest(".search-results-in")).toBeInTheDocument();
		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
		expect(switchByName("Games")).toHaveAttribute("aria-checked", "true");
	});

	it("hides the layers control away from the map", () => {
		mockPathname.mockReturnValue("/admin/metrics");
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
		expect(screen.getByText("Demand")).toBeInTheDocument();
		fireEvent.pointerDown(toggle);
		expect(screen.getByText("Demand")).toBeInTheDocument();

		fireEvent.keyDown(toggle, { key: "Escape" });
		expect(screen.getByText("Demand").closest(".search-results-out")).toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(160);
		});
		expect(screen.queryByText("Demand")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Show layers" }));
		expect(screen.getByText("Demand")).toBeInTheDocument();
		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
		fireEvent.pointerDown(document.body);
		expect(screen.getByText("Demand").closest(".search-results-out")).toBeInTheDocument();
	});

	it("starts collapsed when the person never left it open", () => {
		localStorage.clear();
		renderWithMessages(<MapLayersPanel />);

		expect(screen.getByRole("button", { name: "Show layers" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		expect(screen.queryByText("Demand")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Show layers" })).toHaveAttribute(
			"data-active",
			"false",
		);
	});

	it("remembers whether the panel was left open or closed", () => {
		localStorage.clear();
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(screen.getByRole("button", { name: "Show layers" }));
		expect(localStorage.getItem(LAYERS_PANEL_OPEN_KEY)).toBe("true");
		fireEvent.click(screen.getByRole("button", { name: "Hide layers" }));
		expect(localStorage.getItem(LAYERS_PANEL_OPEN_KEY)).toBe("false");
	});

	it("shows a dot on the button only while a layer differs from the default", () => {
		renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
			</MapLayersProvider>,
		);
		const button = screen.getByRole("button", { name: "Hide layers" });
		expect(button).toHaveAttribute("data-active", "false");
		expect(screen.queryByTestId("layers-indicator")).not.toBeInTheDocument();

		for (const name of ["App sessions", "Games", "Show trend"]) {
			fireEvent.click(switchByName(name));
			expect(button).toHaveAttribute("data-active", "true");
			expect(screen.getByTestId("layers-indicator")).toHaveClass(
				"absolute",
				"top-0",
				"right-0",
				"rounded-full",
				"bg-pleiful-pitch-green-50",
			);
			fireEvent.click(switchByName(name));
			expect(button).toHaveAttribute("data-active", "false");
			expect(screen.queryByTestId("layers-indicator")).not.toBeInTheDocument();
		}
	});

	it("shows the dot while a player filter is applied", () => {
		function Cohort() {
			const layers = useMapLayers();
			return (
				<>
					<button type="button" onClick={() => layers?.setSessionFilters({ gender: "Female" })}>
						Set cohort
					</button>
					<button type="button" onClick={() => layers?.setSessionFilters({ gender: undefined })}>
						Clear cohort
					</button>
				</>
			);
		}
		renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
				<Cohort />
			</MapLayersProvider>,
		);
		const button = screen.getByRole("button", { name: "Hide layers" });
		expect(button).toHaveAttribute("data-active", "false");
		fireEvent.click(screen.getByRole("button", { name: "Set cohort" }));
		expect(button).toHaveAttribute("data-active", "true");
		fireEvent.click(screen.getByRole("button", { name: "Clear cohort" }));
		expect(button).toHaveAttribute("data-active", "false");
	});
});

describe("MapLayersPanel reset", () => {
	function LayersState() {
		const layers = useMapLayers();
		return (
			<>
				<output data-testid="layers-state">
					{JSON.stringify({
						showActiveFacilities: layers?.showActiveFacilities,
						showInactiveFacilities: layers?.showInactiveFacilities,
						showSessions: layers?.showSessions,
						sessionFilters: layers?.sessionFilters,
					})}
				</output>
				<button type="button" onClick={() => layers?.setSessionFilters({ gender: "Female" })}>
					Set cohort
				</button>
			</>
		);
	}

	const DEFAULT_STATE = JSON.stringify({
		showActiveFacilities: true,
		showInactiveFacilities: false,
		showSessions: true,
		sessionFilters: {},
	});

	function renderWithProvider() {
		return renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
				<LayersState />
			</MapLayersProvider>,
		);
	}

	it("is not rendered while every setting matches the default", () => {
		renderWithProvider();

		expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
		expect(screen.queryByTestId("layers-indicator")).not.toBeInTheDocument();
		expect(switchByName("Show trend").parentElement?.nextElementSibling).toBeNull();
	});

	it("appears in a right-aligned footer inside the glass card when a setting differs", () => {
		renderWithProvider();
		const card = screen.getByRole("region", { name: "Demand" }).parentElement;

		for (const name of ["App sessions", "Games", "Show trend"]) {
			fireEvent.click(switchByName(name));
			const reset = screen.getByRole("button", { name: "Reset" });
			expect(reset).toBeEnabled();
			expect(screen.getByTestId("layers-indicator")).toBeInTheDocument();
			fireEvent.click(switchByName(name));
			expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
		}

		fireEvent.click(switchByName("Show trend"));
		const reset = screen.getByRole("button", { name: "Reset" });
		const footer = reset.parentElement;
		expect(card).toHaveClass("map-glass");
		expect(card?.lastElementChild).toBe(footer);
		expect(footer).toHaveClass("flex", "justify-end", "border-t", "border-border");
		expect(reset).toHaveClass("text-xs", "text-muted-foreground", "hover:text-foreground");
		expect(reset).not.toHaveClass("bg-primary");
	});

	it("restores every setting to the default so the button and the dot disappear", () => {
		renderWithProvider();
		const toggle = screen.getByRole("button", { name: "Hide layers" });

		fireEvent.click(switchByName("App sessions"));
		fireEvent.click(switchByName("Games"));
		fireEvent.click(screen.getByRole("button", { name: "Set cohort" }));
		expect(screen.getByTestId("layers-state")).toHaveTextContent(
			JSON.stringify({
				showActiveFacilities: false,
				showInactiveFacilities: false,
				showSessions: false,
				sessionFilters: { gender: "Female" },
			}),
		);
		expect(toggle).toHaveAttribute("data-active", "true");

		fireEvent.click(screen.getByRole("button", { name: "Reset" }));

		expect(screen.getByTestId("layers-state")).toHaveTextContent(DEFAULT_STATE);
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
		expect(switchByName("Games")).toHaveAttribute("aria-checked", "true");
		expect(
			screen.queryByRole("switch", { name: "Show inactive facilities" }),
		).not.toBeInTheDocument();
		expect(toggle).toHaveAttribute("data-active", "false");
		expect(screen.queryByTestId("layers-indicator")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
		expect(screen.getByText("Demand")).toBeInTheDocument();
		expect(toggle).toHaveFocus();
	});

	it("shows Reset for a player filter alone and clears it", () => {
		renderWithProvider();

		fireEvent.click(screen.getByRole("button", { name: "Set cohort" }));
		fireEvent.click(screen.getByRole("button", { name: "Reset" }));

		expect(screen.getByTestId("layers-state")).toHaveTextContent(DEFAULT_STATE);
		expect(screen.getByText("Player filters")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
	});

	it("restores the defaults without a provider", () => {
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(switchByName("Games"));
		fireEvent.click(switchByName("App sessions"));
		fireEvent.click(screen.getByRole("button", { name: "Reset" }));

		expect(switchByName("Games")).toHaveAttribute("aria-checked", "true");
		expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
		expect(screen.queryByTestId("layers-indicator")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
	});

	it("reads Redefinir in Portuguese", () => {
		render(
			<MessagesProvider locale="pt-BR" messages={getMessages("pt-BR")}>
				<MapLayersPanel />
			</MessagesProvider>,
		);

		fireEvent.click(screen.getByRole("switch", { name: "Jogos" }));
		expect(screen.getByRole("button", { name: "Redefinir" })).toBeInTheDocument();
	});
});

it("shows the demographic controls", () => {
	renderWithMessages(<MapLayersPanel />);
	expect(screen.getByText("Player filters")).toBeInTheDocument();
});

it("selects one demand metric and resets it", () => {
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	expect(screen.getByRole("radio", { name: "App sessions" })).toBeChecked();
	fireEvent.click(screen.getByRole("radio", { name: "User registrations" }));
	expect(screen.getByRole("radio", { name: "User registrations" })).toBeChecked();
	expect(switchByName("User registrations")).toHaveAttribute("aria-checked", "true");
	fireEvent.click(switchByName("User registrations"));
	expect(switchByName("User registrations")).toHaveAttribute("aria-checked", "false");
	expect(screen.queryByRole("radiogroup", { name: "Demand" })).not.toBeInTheDocument();
	fireEvent.click(switchByName("User registrations"));
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(screen.getByRole("radio", { name: "App sessions" })).toBeChecked();
	expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
});

it("navigates demand options with the keyboard", () => {
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	const group = screen.getByRole("radiogroup", { name: "Demand" });
	const sessions = screen.getByRole("radio", { name: "App sessions" });
	const registrations = screen.getByRole("radio", { name: "User registrations" });
	sessions.focus();
	fireEvent.keyDown(group, { key: "ArrowDown" });
	expect(registrations).toHaveFocus();
	fireEvent.keyDown(group, { key: "ArrowUp" });
	expect(sessions).toHaveFocus();
	fireEvent.keyDown(group, { key: "End" });
	expect(registrations).toHaveFocus();
	fireEvent.keyDown(group, { key: "Home" });
	expect(sessions).toHaveFocus();
});

it("defaults to Games and resets supply back to Games", () => {
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	expect(screen.getByRole("radio", { name: "Games" })).toBeChecked();
	const group = screen.getByRole("radiogroup", { name: "Supply" });
	const active = screen.getByRole("radio", { name: "Facilities" });
	const games = screen.getByRole("radio", { name: "Games" });
	expect(group.querySelectorAll('input[type="radio"]')).toHaveLength(2);
	games.focus();
	fireEvent.keyDown(group, { key: "End" });
	expect(active).toHaveFocus();
	fireEvent.keyDown(group, { key: "ArrowUp" });
	expect(games).toHaveFocus();
	fireEvent.keyDown(group, { key: "Home" });
	expect(games).toHaveFocus();
	fireEvent.click(active);
	expect(screen.getByRole("radio", { name: "Facilities" })).toBeChecked();
	expect(switchByName("Facilities")).toHaveAttribute("aria-checked", "true");
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(screen.getByRole("radio", { name: "Games" })).toBeChecked();
});

it("shows the inactive sub-filter only for Facilities and defaults it off", () => {
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	expect(
		screen.queryByRole("switch", { name: "Show inactive facilities" }),
	).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("radio", { name: "Facilities" }));
	expect(switchByName("Show inactive facilities")).toHaveAttribute("aria-checked", "false");
	fireEvent.click(switchByName("Show inactive facilities"));
	expect(switchByName("Show inactive facilities")).toHaveAttribute("aria-checked", "true");
	fireEvent.click(screen.getByRole("radio", { name: "Games" }));
	expect(
		screen.queryByRole("switch", { name: "Show inactive facilities" }),
	).not.toBeInTheDocument();
});

it("preserves Department across supply modes and clears it with the layer Reset", () => {
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Department" }));
	fireEvent.click(screen.getByRole("checkbox", { name: "Magic" }));
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	expect(screen.getByRole("button", { name: "Remove Magic filter" })).toBeInTheDocument();
	fireEvent.click(screen.getByRole("radio", { name: "Facilities" }));
	expect(screen.getByRole("button", { name: "Remove Magic filter" })).toBeInTheDocument();
	fireEvent.click(screen.getByRole("radio", { name: "Games" }));
	expect(screen.getByRole("button", { name: "Remove Magic filter" })).toBeInTheDocument();
	fireEvent.click(screen.getAllByRole("button", { name: "Reset" }).at(-1) as HTMLElement);
	expect(screen.queryByRole("button", { name: "Remove Magic filter" })).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
});

it("offers only the footer Reset for pending filter pills", () => {
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Department" }));
	expect(screen.getAllByRole("button", { name: "Reset" })).toHaveLength(1);
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(screen.queryByRole("button", { name: "Department" })).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
});

it("shows Reset while demand filter controls are open", () => {
	function MarkDemandFilters() {
		const layers = useMapLayers();
		useEffect(() => {
			layers?.setDemandFiltersPresent?.(true);
		}, [layers]);
		return null;
	}
	renderWithMessages(
		<MapLayersProvider>
			<MarkDemandFilters />
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
});

it("shows Reset while supply filter controls are open", () => {
	function MarkSupplyFilters() {
		const layers = useMapLayers();
		useEffect(() => {
			layers?.setSupplyFiltersPresent?.(true);
		}, [layers]);
		return null;
	}
	renderWithMessages(
		<MapLayersProvider>
			<MarkSupplyFilters />
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
});

describe("Show trend", () => {
	function TrendState() {
		const layers = useMapLayers();
		return <output data-testid="trend-state">{String(layers?.showGamesTrend)}</output>;
	}

	function renderTrendPanel() {
		return renderWithMessages(
			<MapLayersProvider>
				<MapLayersPanel />
				<TrendState />
			</MapLayersProvider>,
		);
	}

	it("sits under Games, off by default, styled like the inactive facilities switch", () => {
		renderTrendPanel();

		const trend = switchByName("Show trend");
		expect(trend).toHaveAttribute("aria-checked", "false");
		expect(trend).toHaveClass("bg-[#e5e5e5]", "h-[13px]", "w-[22px]", "p-[1px]");
		expect(trend.parentElement).toHaveClass("px-2", "py-1.5");
		expect(screen.getByText("Show trend")).toHaveClass("text-xs");
		expect(screen.getByTestId("trend-state")).toHaveTextContent("false");

		fireEvent.click(trend);
		expect(switchByName("Show trend")).toHaveAttribute("aria-checked", "true");
		expect(switchByName("Show trend")).toHaveClass("bg-pleiful-pitch-green-80");
		expect(screen.getByTestId("trend-state")).toHaveTextContent("true");
	});

	it("only appears for the Games supply", () => {
		renderTrendPanel();

		fireEvent.click(screen.getByRole("radio", { name: "Facilities" }));
		expect(screen.queryByRole("switch", { name: "Show trend" })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Games" }));
		expect(switchByName("Show trend")).toBeInTheDocument();
	});

	it("keeps its state for Games while hidden in Facilities mode", () => {
		renderTrendPanel();
		fireEvent.click(switchByName("Show trend"));

		fireEvent.click(screen.getByRole("radio", { name: "Facilities" }));
		expect(screen.queryByRole("switch", { name: "Show trend" })).not.toBeInTheDocument();
		expect(screen.getByTestId("trend-state")).toHaveTextContent("true");

		fireEvent.click(screen.getByRole("radio", { name: "Games" }));
		expect(switchByName("Show trend")).toHaveAttribute("aria-checked", "true");
	});

	it("turns on the dot and Reset, and Reset turns it back off", () => {
		renderTrendPanel();
		const button = screen.getByRole("button", { name: "Hide layers" });
		expect(button).toHaveAttribute("data-active", "false");

		fireEvent.click(switchByName("Show trend"));
		expect(button).toHaveAttribute("data-active", "true");
		expect(screen.getByTestId("layers-indicator")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Reset" }));

		expect(screen.getByTestId("trend-state")).toHaveTextContent("false");
		expect(switchByName("Show trend")).toHaveAttribute("aria-checked", "false");
		expect(button).toHaveAttribute("data-active", "false");
		expect(screen.queryByTestId("layers-indicator")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
	});

	it("toggles and resets without a provider", () => {
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(switchByName("Show trend"));
		expect(switchByName("Show trend")).toHaveAttribute("aria-checked", "true");
		fireEvent.click(screen.getByRole("button", { name: "Reset" }));
		expect(switchByName("Show trend")).toHaveAttribute("aria-checked", "false");
	});

	it.each([
		["pt-BR", "Mostrar tendência"],
		["es", "Mostrar tendencia"],
	] as const)("reads the %s label", (locale, label) => {
		render(
			<MessagesProvider locale={locale} messages={getMessages(locale)}>
				<MapLayersPanel />
			</MessagesProvider>,
		);
		expect(screen.getByRole("switch", { name: label })).toHaveAttribute("aria-checked", "false");
	});
});

it("hides sub-filters when their parent layer is off and restores them when on", () => {
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	fireEvent.click(switchByName("Show trend"));
	fireEvent.click(switchByName("Games"));
	expect(screen.queryByRole("switch", { name: "Show trend" })).not.toBeInTheDocument();
	expect(screen.queryByRole("region", { name: "Department" })).not.toBeInTheDocument();
	expect(screen.getByText("Player filters")).toBeInTheDocument();
	fireEvent.click(switchByName("Games"));
	expect(switchByName("Show trend")).toHaveAttribute("aria-checked", "true");
	expect(screen.getByRole("region", { name: "Department" })).toBeInTheDocument();
	fireEvent.click(switchByName("App sessions"));
	expect(screen.queryByText("Player filters")).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Add session filter" })).not.toBeInTheDocument();
	expect(switchByName("Show trend")).toBeInTheDocument();
	fireEvent.click(switchByName("App sessions"));
	expect(screen.getByText("Player filters")).toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Add session filter" })).toBeInTheDocument();
});
