import { getMessages } from "@market-health-map/core/i18n";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { LAYERS_PANEL_OPEN_KEY } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";
import { MapLayersPanel } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockFeatureFlag = vi.fn(() => false);
vi.mock("@/presentation/hooks/use-feature-flags/use-feature-flags", () => ({
	useFeatureFlag: () => mockFeatureFlag(),
}));
vi.mock("@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent", () => ({
	AppSessionFilters: () => <div>Player filters</div>,
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
		const layersCard = screen.getByRole("heading", { name: "Demand" }).parentElement;
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
		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
		expect(screen.getByText("Demand")).toHaveClass(
			"px-2",
			"pt-1.5",
			"pb-1",
			"text-[10px]",
			"font-semibold",
			"tracking-wider",
			"text-muted-foreground",
			"uppercase",
		);
		expect(screen.getByText("Demand")).not.toHaveClass("font-medium", "text-sm");
		expect(screen.getByText("Supply")).toHaveClass(
			"text-[10px]",
			"font-semibold",
			"tracking-wider",
			"text-muted-foreground",
			"uppercase",
		);
		expect(screen.getByText("App sessions")).toHaveClass("text-sm", "font-medium");
		expect(screen.getByText("Active facilities")).toHaveClass("text-sm", "font-medium");
		expect(screen.getByText("Inactive facilities")).toHaveClass("text-sm", "font-medium");
		expect(screen.getByText("App sessions").parentElement).toHaveClass("px-2", "py-1.5", "gap-2");
		expect(screen.getByText("App sessions").parentElement).not.toHaveClass("text-sm");
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
		expect(toggle.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
		expect(toggle).not.toHaveTextContent("Layers");

		vi.useFakeTimers();
		fireEvent.click(toggle);

		expect(screen.getByText("Demand").closest(".search-results-out")).toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(160);
		});

		expect(screen.queryByText("Demand")).not.toBeInTheDocument();
		expect(screen.queryByRole("switch", { name: "Active facilities" })).not.toBeInTheDocument();
		const expand = screen.getByRole("button", { name: "Show layers" });
		expect(expand).toHaveClass("map-glass", "map-icon-button", "rounded-full");
		expect(expand.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
		expect(expand.parentElement).not.toHaveClass("border-b");

		fireEvent.click(expand);

		expect(screen.getByText("Demand").closest(".search-results-in")).toBeInTheDocument();
		expect(screen.queryByText("Layers")).not.toBeInTheDocument();
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

		for (const name of ["App sessions", "Active facilities", "Inactive facilities"]) {
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
		mockFeatureFlag.mockReturnValue(true);
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
		mockFeatureFlag.mockReturnValue(false);
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
		showInactiveFacilities: true,
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
		expect(switchByName("Inactive facilities").parentElement?.nextElementSibling).toBeNull();
	});

	it("appears in a right-aligned footer inside the glass card when a setting differs", () => {
		renderWithProvider();
		const card = screen.getByRole("heading", { name: "Demand" }).parentElement;

		for (const name of ["App sessions", "Active facilities", "Inactive facilities"]) {
			fireEvent.click(switchByName(name));
			const reset = screen.getByRole("button", { name: "Reset" });
			expect(reset).toBeEnabled();
			expect(screen.getByTestId("layers-indicator")).toBeInTheDocument();
			fireEvent.click(switchByName(name));
			expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
		}

		fireEvent.click(switchByName("Inactive facilities"));
		const reset = screen.getByRole("button", { name: "Reset" });
		const footer = reset.parentElement;
		expect(card).toHaveClass("map-glass");
		expect(card?.lastElementChild).toBe(footer);
		expect(footer).toHaveClass("flex", "justify-end", "border-t", "border-border");
		expect(reset).toHaveClass("text-xs", "text-muted-foreground", "hover:text-foreground");
		expect(reset).not.toHaveClass("bg-primary");
	});

	it("restores every setting to the default so the button and the dot disappear", () => {
		mockFeatureFlag.mockReturnValue(true);
		renderWithProvider();
		const toggle = screen.getByRole("button", { name: "Hide layers" });

		fireEvent.click(switchByName("App sessions"));
		fireEvent.click(switchByName("Active facilities"));
		fireEvent.click(switchByName("Inactive facilities"));
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
		expect(switchByName("Active facilities")).toHaveAttribute("aria-checked", "true");
		expect(switchByName("Inactive facilities")).toHaveAttribute("aria-checked", "true");
		expect(toggle).toHaveAttribute("data-active", "false");
		expect(screen.queryByTestId("layers-indicator")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
		expect(screen.getByText("Demand")).toBeInTheDocument();
		expect(toggle).toHaveFocus();
		mockFeatureFlag.mockReturnValue(false);
	});

	it("shows Reset for a player filter alone and clears it", () => {
		mockFeatureFlag.mockReturnValue(true);
		renderWithProvider();

		fireEvent.click(screen.getByRole("button", { name: "Set cohort" }));
		fireEvent.click(screen.getByRole("button", { name: "Reset" }));

		expect(screen.getByTestId("layers-state")).toHaveTextContent(DEFAULT_STATE);
		expect(screen.getByText("Player filters")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
		mockFeatureFlag.mockReturnValue(false);
	});

	it("restores the defaults without a provider", () => {
		renderWithMessages(<MapLayersPanel />);

		fireEvent.click(switchByName("Active facilities"));
		fireEvent.click(switchByName("App sessions"));
		fireEvent.click(screen.getByRole("button", { name: "Reset" }));

		expect(switchByName("Active facilities")).toHaveAttribute("aria-checked", "true");
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

		fireEvent.click(screen.getByRole("switch", { name: "Instalações ativas" }));
		expect(screen.getByRole("button", { name: "Redefinir" })).toBeInTheDocument();
	});
});

it("shows demographic controls only when the flag is on", () => {
	mockFeatureFlag.mockReturnValue(true);
	const { unmount } = renderWithMessages(<MapLayersPanel />);
	expect(screen.getByText("Player filters")).toBeInTheDocument();
	unmount();
	mockFeatureFlag.mockReturnValue(false);
	renderWithMessages(<MapLayersPanel />);
	expect(screen.queryByText("Player filters")).not.toBeInTheDocument();
});

it("clears the applied cohort when its feature flag is disabled", () => {
	function State() {
		const layers = useMapLayers();
		return (
			<>
				<output data-testid="cohort">{JSON.stringify(layers?.sessionFilters)}</output>
				<button type="button" onClick={() => layers?.setSessionFilters({ gender: "Female" })}>
					Set cohort
				</button>
			</>
		);
	}
	mockFeatureFlag.mockReturnValue(true);
	const tree = (
		<MapLayersProvider>
			<MapLayersPanel />
			<State />
		</MapLayersProvider>
	);
	const { rerender } = renderWithMessages(tree);
	fireEvent.click(screen.getByRole("button", { name: "Set cohort" }));
	expect(screen.getByTestId("cohort")).toHaveTextContent("Female");
	mockFeatureFlag.mockReturnValue(false);
	rerender(
		<MapLayersProvider>
			<MapLayersPanel />
			<State />
		</MapLayersProvider>,
	);
	expect(screen.getByTestId("cohort")).toHaveTextContent("{}");
});

it("selects one demand metric behind the demographic flag and resets it", () => {
	mockFeatureFlag.mockReturnValue(true);
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	const selector = screen.getByRole("button", { name: "Demand" });
	expect(selector).toHaveTextContent("App sessions");
	fireEvent.click(selector);
	expect(screen.getByRole("listbox", { name: "Demand" })).toHaveClass("map-glass", "border-border");
	fireEvent.click(screen.getByRole("option", { name: "User registrations" }));
	expect(selector).toHaveTextContent("User registrations");
	expect(selector).toHaveFocus();
	expect(switchByName("User registrations")).toHaveAttribute("aria-checked", "true");
	fireEvent.click(switchByName("User registrations"));
	expect(switchByName("User registrations")).toHaveAttribute("aria-checked", "false");
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(selector).toHaveTextContent("App sessions");
	expect(switchByName("App sessions")).toHaveAttribute("aria-checked", "true");
	mockFeatureFlag.mockReturnValue(false);
});
it("hides the demand selector when the flag is off", () => {
	mockFeatureFlag.mockReturnValue(false);
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	expect(screen.queryByRole("button", { name: "Demand" })).not.toBeInTheDocument();
});

it("navigates demand options with the keyboard and closes on Escape and outside clicks", () => {
	mockFeatureFlag.mockReturnValue(true);
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	const trigger = screen.getByRole("button", { name: "Demand" });
	fireEvent.keyDown(trigger, { key: "ArrowDown" });
	const sessions = screen.getByRole("option", { name: "App sessions" });
	const registrations = screen.getByRole("option", { name: "User registrations" });
	expect(sessions).toHaveFocus();
	fireEvent.keyDown(sessions, { key: "ArrowDown" });
	expect(registrations).toHaveFocus();
	fireEvent.keyDown(registrations, { key: "ArrowUp" });
	expect(sessions).toHaveFocus();
	fireEvent.keyDown(sessions, { key: "End" });
	expect(registrations).toHaveFocus();
	fireEvent.keyDown(registrations, { key: "Home" });
	expect(sessions).toHaveFocus();
	fireEvent.keyDown(sessions, { key: "Escape" });
	expect(screen.queryByRole("listbox", { name: "Demand" })).not.toBeInTheDocument();
	expect(trigger).toHaveFocus();
	expect(screen.getByRole("button", { name: "Hide layers" })).toBeInTheDocument();
	fireEvent.click(trigger);
	fireEvent.pointerDown(document.body);
	expect(screen.queryByRole("listbox", { name: "Demand" })).not.toBeInTheDocument();
	mockFeatureFlag.mockReturnValue(false);
});

it("selects Games as supply and resets to active facilities", () => {
	mockFeatureFlag.mockReturnValue(true);
	renderWithMessages(
		<MapLayersProvider>
			<MapLayersPanel />
		</MapLayersProvider>,
	);
	const trigger = screen.getByRole("button", { name: "Supply" });
	fireEvent.keyDown(trigger, { key: "ArrowDown" });
	const active = screen.getByRole("option", { name: "Active facilities" });
	const games = screen.getByRole("option", { name: "Games · last 28 days" });
	expect(active).toHaveFocus();
	fireEvent.keyDown(active, { key: "End" });
	expect(games).toHaveFocus();
	fireEvent.keyDown(games, { key: "ArrowUp" });
	expect(active).toHaveFocus();
	fireEvent.keyDown(active, { key: "Home" });
	expect(active).toHaveFocus();
	fireEvent.keyDown(active, { key: "Escape" });
	expect(trigger).toHaveFocus();
	fireEvent.click(trigger);
	fireEvent.pointerDown(document.body);
	expect(screen.queryByRole("listbox", { name: "Supply" })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Show layers" }));
	fireEvent.click(trigger);
	fireEvent.click(screen.getByRole("option", { name: "Games · last 28 days" }));
	expect(trigger).toHaveTextContent("Games · last 28 days");
	expect(trigger).toHaveFocus();
	expect(switchByName("Games · last 28 days")).toHaveAttribute("aria-checked", "true");
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(screen.getByRole("button", { name: "Supply" })).toHaveTextContent("Active facilities");
	mockFeatureFlag.mockReturnValue(false);
});
