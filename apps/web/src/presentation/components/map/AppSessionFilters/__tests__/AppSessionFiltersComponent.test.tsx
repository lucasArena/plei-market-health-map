import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { AppSessionFilters } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

let appliedListener: (() => void) | undefined;

function State() {
	const layers = useMapLayers();
	return (
		<>
			<output data-testid="filters">{JSON.stringify(layers?.sessionFilters)}</output>
			<button type="button" onClick={() => layers?.setShowSessions(!layers.showSessions)}>
				Toggle sessions
			</button>
			<button type="button" onClick={() => layers?.setSessionFilters({ gender: "Female" })}>
				Set one gender
			</button>
			<AppSessionFilters showSessions={layers?.showSessions ?? true} onApplied={appliedListener} />
		</>
	);
}

function setup(mode = "success") {
	const fetchMock = vi.fn(async (url: string) => {
		const options = url.endsWith("/filters");
		const failed = mode === (options ? "options-fail" : "sessions-fail");
		const data = options
			? { genders: ["Female", "Male", "Other", "Prefer not to say"], skills: [], ages: [] }
			: [{ lat: 30, lng: -80, sessionWeight: 10 }];
		return {
			ok: !failed,
			status: failed ? 500 : 200,
			json: async () => ({ data: !options && mode === "empty" ? [] : data }),
		};
	});
	vi.stubGlobal("fetch", fetchMock);
	const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
	if (mode !== "options-fail") {
		client.setQueryData(["app-session-filter-options"], {
			genders: ["Female", "Male", "Other", "Prefer not to say"],
			skills: ["Beginner", "Intermediate", "Advanced", "Expert"],
			ages: [],
		});
	}
	const rendered = renderWithMessages(
		<QueryClientProvider client={client}>
			<MapLayersProvider>
				<State />
			</MapLayersProvider>
		</QueryClientProvider>,
	);
	return { fetchMock, client, ...rendered };
}

function openGender() {
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Gender" }));
}

afterEach(() => {
	appliedListener = undefined;
	vi.unstubAllGlobals();
});

beforeEach(() => localStorage.clear());

it("keeps gender choices inside the panel and applies them as removable chips", async () => {
	const { container } = setup();
	expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Player skill level" })).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Player age" })).not.toBeInTheDocument();
	expect(container.querySelector(".map-glass")).toBeNull();
	expect(screen.getByRole("button", { name: "Add filter" }).querySelector("svg")).toHaveClass(
		"-rotate-90",
	);
	expect(screen.getByRole("button", { name: "Add filter" })).toHaveClass(
		"hover:bg-foreground/[0.07]",
	);
	expect(screen.getByRole("button", { name: "Add filter" })).not.toHaveClass(
		"focus:bg-foreground/[0.07]",
	);

	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	expect(screen.getByRole("button", { name: "Add filter" })).toHaveAttribute(
		"aria-expanded",
		"true",
	);
	expect(screen.getByRole("button", { name: "Add filter" }).querySelector("svg")).not.toHaveClass(
		"-rotate-90",
	);
	expect(screen.getByRole("button", { name: "Gender" }).parentElement?.parentElement).toHaveClass(
		"ml-3",
		"border-l",
	);
	expect(
		screen.getByRole("button", { name: "Player skill level" }).parentElement?.parentElement,
	).toHaveClass("ml-3", "border-l");
	expect(screen.getByRole("button", { name: "Gender" })).toHaveAttribute("aria-expanded", "false");
	expect(screen.getByRole("button", { name: "Gender" }).querySelector("svg")).toHaveClass(
		"-rotate-90",
	);
	expect(
		screen.getByRole("button", { name: "Player skill level" }).querySelector("svg"),
	).toHaveClass("-rotate-90");
	expect(screen.getByRole("button", { name: "Gender" })).toHaveClass("hover:bg-foreground/[0.07]");
	expect(screen.getByRole("button", { name: "Gender" })).not.toHaveClass(
		"focus:bg-foreground/[0.07]",
	);
	expect(screen.getByRole("button", { name: "Player skill level" })).toHaveClass(
		"hover:bg-foreground/[0.07]",
	);
	expect(screen.getByRole("button", { name: "Player age" })).toHaveAttribute(
		"aria-expanded",
		"false",
	);
	expect(screen.getByRole("button", { name: "Player age" }).querySelector("svg")).toHaveClass(
		"-rotate-90",
	);
	expect(
		screen.getByRole("button", { name: "Player age" }).parentElement?.parentElement,
	).toHaveClass("ml-3", "border-l");
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	expect(screen.queryByRole("button", { name: "Gender" })).not.toBeInTheDocument();

	openGender();
	expect(
		["Female", "Male", "Other", "Prefer not to say"].map((name) =>
			screen.getByRole("checkbox", { name }),
		),
	).toHaveLength(4);
	expect(container.querySelector(".map-glass")).toBeNull();

	fireEvent.click(screen.getByRole("checkbox", { name: "Female" }));
	fireEvent.click(screen.getByRole("checkbox", { name: "Male" }));
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
	expect(screen.queryByRole("button", { name: "Remove Female filter" })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	await waitFor(() =>
		expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
			gender: ["Female", "Male"],
		}),
	);
	expect(screen.queryByRole("button", { name: "Apply filter" })).not.toBeInTheDocument();
	expect(screen.getByRole("checkbox", { name: "Female" })).toBeChecked();
	expect(
		screen.getByRole("checkbox", { name: "Female" }).parentElement?.querySelector("svg"),
	).toHaveClass("size-3");
	expect(screen.getByRole("button", { name: "Remove Female filter" })).toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Remove Male filter" })).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Remove Female filter" }));
	expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
		gender: ["Male"],
	});
	fireEvent.click(screen.getByRole("button", { name: "Remove Male filter" }));
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
	expect(screen.queryByRole("button", { name: "Remove Male filter" })).not.toBeInTheDocument();
});

it("adds skill levels the same way and keeps the selected genders", () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Gender" }));
	fireEvent.click(screen.getByRole("checkbox", { name: "Female" }));
	fireEvent.click(screen.getByRole("button", { name: "Player skill level" }));
	expect(
		["Beginner", "Intermediate", "Advanced", "Expert"].every((name) =>
			screen.getByRole("checkbox", { name }),
		),
	).toBe(true);
	const beginner = screen.getByRole("checkbox", { name: "Beginner" });
	expect(beginner).toHaveFocus();
	fireEvent.keyDown(beginner, { key: "ArrowDown" });
	expect(screen.getByRole("checkbox", { name: "Intermediate" })).toHaveFocus();
	fireEvent.click(screen.getByRole("checkbox", { name: "Beginner" }));
	fireEvent.click(screen.getByRole("checkbox", { name: "Advanced" }));
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
		gender: ["Female"],
		skill: ["Advanced", "Beginner"],
	});
	expect(screen.getByRole("button", { name: "Remove Beginner filter" })).toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Remove Advanced filter" }));
	expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
		gender: ["Female"],
		skill: ["Beginner"],
	});
	beginner.focus();
	fireEvent.keyDown(beginner, { key: "Escape" });
	expect(screen.queryByRole("checkbox", { name: "Beginner" })).not.toBeInTheDocument();
	expect(screen.getByRole("checkbox", { name: "Female" })).toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Player skill level" })).toHaveFocus();
});

it("collapses the list when sessions turn off and keeps the selected chip", async () => {
	setup();
	openGender();
	fireEvent.click(screen.getByRole("checkbox", { name: "Female" }));
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Toggle sessions" }));
	expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Add filter" })).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Remove Female filter" })).toBeDisabled();
	expect(screen.getByTestId("filters")).toHaveTextContent('"gender":["Female"]');
	fireEvent.click(screen.getByRole("button", { name: "Toggle sessions" }));
	expect(screen.getByRole("button", { name: "Add filter" })).toBeEnabled();
});

it("deselects a gender before applying filters", () => {
	setup();
	openGender();
	fireEvent.click(screen.getByRole("checkbox", { name: "Female" }));
	fireEvent.click(screen.getByRole("checkbox", { name: "Female" }));
	expect(screen.queryByRole("button", { name: "Apply filter" })).not.toBeInTheDocument();
});

it("moves through gender choices with the keyboard and collapses in place", () => {
	setup();
	openGender();
	const female = screen.getByRole("checkbox", { name: "Female" });
	expect(female).toHaveFocus();
	fireEvent.keyDown(female, { key: "ArrowDown" });
	expect(screen.getByRole("checkbox", { name: "Male" })).toHaveFocus();
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
	expect(screen.getByRole("checkbox", { name: "Prefer not to say" })).toHaveFocus();
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
	expect(female).toHaveFocus();
	fireEvent.keyDown(female, { key: "ArrowUp" });
	expect(screen.getByRole("checkbox", { name: "Prefer not to say" })).toHaveFocus();
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Escape" });
	expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Gender" })).toHaveFocus();
	fireEvent.keyDown(screen.getByRole("button", { name: "Gender" }), { key: "Escape" });
	expect(screen.queryByRole("button", { name: "Gender" })).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Add filter" })).toHaveFocus();
});

it("applies a minimum and maximum age and removes them together", () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Player age" }));
	const minimum = screen.getByRole("textbox", { name: "Minimum age" });
	expect(minimum).toHaveFocus();
	fireEvent.change(minimum, { target: { value: "40" } });
	fireEvent.change(screen.getByRole("textbox", { name: "Maximum age" }), {
		target: { value: "18" },
	});
	expect(
		screen.getByText("Enter whole ages from 0 to 120, with minimum no greater than maximum."),
	).toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Apply filter" })).not.toBeInTheDocument();
	fireEvent.change(screen.getByRole("textbox", { name: "Maximum age" }), {
		target: { value: "64" },
	});
	expect(screen.queryByText(/Enter whole ages/)).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
		ageMin: 40,
		ageMax: 64,
	});
	expect(screen.getByRole("button", { name: "Remove 40–64 filter" })).toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Remove 40–64 filter" }));
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
});

it("steps an age with the chevrons and keeps keyboard entry", () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Player age" }));
	const minimum = screen.getByRole("textbox", { name: "Minimum age" });
	fireEvent.click(screen.getByRole("button", { name: "Decrease minimum age" }));
	expect(minimum).toHaveValue("");
	fireEvent.click(screen.getByRole("button", { name: "Increase minimum age" }));
	expect(minimum).toHaveValue("0");
	fireEvent.change(minimum, { target: { value: "17" } });
	fireEvent.click(screen.getByRole("button", { name: "Increase minimum age" }));
	expect(minimum).toHaveValue("18");
	fireEvent.click(screen.getByRole("button", { name: "Decrease minimum age" }));
	expect(minimum).toHaveValue("17");
});

it("closes the skill submenu on Escape and returns focus to Player skill level", () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Player skill level" }));
	const beginner = screen.getByRole("checkbox", { name: "Beginner" });
	beginner.focus();
	fireEvent.keyDown(beginner, { key: "Escape" });
	expect(screen.queryByRole("checkbox", { name: "Beginner" })).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Player skill level" })).toHaveFocus();
});

it("collapses open submenus when Add filter closes", () => {
	setup();
	openGender();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	expect(screen.queryByRole("checkbox", { name: "Female" })).not.toBeInTheDocument();
});

it("closes the age submenu on Escape and returns focus to Player age", () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Player age" }));
	const minimum = screen.getByRole("textbox", { name: "Minimum age" });
	minimum.focus();
	fireEvent.keyDown(minimum, { key: "Escape" });
	expect(screen.queryByRole("textbox", { name: "Minimum age" })).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Player age" })).toHaveFocus();
});

it("shows an existing single gender as a chip", () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Set one gender" }));
	expect(screen.getByRole("button", { name: "Remove Female filter" })).toBeInTheDocument();
});

it("leaves empty and failed session messages out of the filter control", () => {
	const empty = setup("empty");
	expect(screen.queryByText("No sessions match these filters.")).not.toBeInTheDocument();
	empty.unmount();

	const failed = setup("sessions-fail");
	expect(screen.queryByText("Couldn’t load sessions. Try again.")).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
	failed.unmount();

	setup("options-fail");
	openGender();
	expect(screen.getByRole("checkbox", { name: "Female" })).toBeInTheDocument();
	fireEvent.click(screen.getByRole("checkbox", { name: "Female" }));
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
		gender: ["female"],
	});
});

it("submits the warehouse spelling and ignores arrow keys while the list is closed", () => {
	setup();
	fireEvent.keyDown(screen.getByRole("button", { name: "Add filter" }), { key: "ArrowDown" });
	openGender();
	fireEvent.click(screen.getByRole("checkbox", { name: "Prefer not to say" }));
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
		gender: ["Prefer not to say"],
	});
});

it("notifies once a filter is added and stays quiet when one is removed", () => {
	const listener = vi.fn();
	appliedListener = listener;
	setup();
	openGender();
	fireEvent.click(screen.getByRole("checkbox", { name: "Female" }));
	expect(listener).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	expect(listener).toHaveBeenCalledTimes(1);
	fireEvent.click(screen.getByRole("button", { name: "Remove Female filter" }));
	expect(listener).toHaveBeenCalledTimes(1);
});

it("renders without the layers panel", () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(() => new Promise(() => {})),
	);
	renderWithMessages(
		<QueryClientProvider client={new QueryClient()}>
			<AppSessionFilters showSessions />
		</QueryClientProvider>,
	);
	openGender();
	fireEvent.click(screen.getByRole("checkbox", { name: "Other" }));
	expect(screen.queryByRole("button", { name: "Remove Other filter" })).not.toBeInTheDocument();
});
