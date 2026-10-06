import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { AppSessionFilters } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

function State() {
	const layers = useMapLayers();
	return (
		<>
			<output data-testid="filters">{JSON.stringify(layers?.sessionFilters)}</output>
			<button type="button" onClick={() => layers?.setShowSessions(!layers.showSessions)}>
				Toggle sessions
			</button>
			<AppSessionFilters showSessions={layers?.showSessions ?? true} />
		</>
	);
}
function setup(mode = "success") {
	const fetchMock = vi.fn(async (url: string) => {
		const options = url.endsWith("/filters");
		const failed = mode === (options ? "options-fail" : "sessions-fail");
		const data = options
			? { genders: ["Female", "Male"], skills: ["Advanced", "Beginner"], ages: [17, 25, 35, 45] }
			: [{ lat: 30, lng: -80, sessionWeight: 10 }];
		return {
			ok: !failed,
			status: failed ? 500 : 200,
			json: async () => ({ data: !options && mode === "empty" ? [] : data }),
		};
	});
	vi.stubGlobal("fetch", fetchMock);
	const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
	const rendered = renderWithMessages(
		<QueryClientProvider client={client}>
			<MapLayersProvider>
				<State />
			</MapLayersProvider>
		</QueryClientProvider>,
	);
	return { fetchMock, client, ...rendered };
}
async function add(label: string, choice: string) {
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("option", { name: label }));
	if (label === "Player age") {
		const bounds: Record<string, [string, string]> = {
			"18–35": ["18", "35"],
			"Under 18": ["", "17"],
			"21+": ["21", ""],
		};
		const [min, max] = bounds[choice] ?? ["", ""];
		fireEvent.change(screen.getByLabelText("Minimum age"), { target: { value: min } });
		fireEvent.change(screen.getByLabelText("Maximum age"), { target: { value: max } });
	} else {
		await waitFor(() => expect(screen.getByRole("option", { name: choice })).toBeInTheDocument());
		fireEvent.click(screen.getByRole("option", { name: choice }));
	}
	fireEvent.click(screen.getByRole("button", { name: "Close filter options" }));
}
afterEach(() => vi.unstubAllGlobals());
it("starts compact, adds only chosen filters and applies one combined cohort", async () => {
	const { fetchMock, container } = setup();
	expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	expect(container.querySelector("select")).toBeNull();
	expect(screen.queryByRole("button", { name: "Gender" })).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Apply filters" })).not.toBeInTheDocument();
	await add("Gender", "Female");
	await add("Player skill level", "Advanced");
	await add("Player age", "18–35");
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
	expect(screen.getByText("Pending changes")).toBeInTheDocument();
	expect(fetchMock.mock.calls.filter(([url]) => !url.endsWith("/filters"))).toHaveLength(1);
	expect(screen.getByRole("button", { name: "Add filter" })).toBeDisabled();
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
	expect(screen.queryByText("Applied: Female · Advanced · 18–35")).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
	expect(screen.queryByRole("button", { name: "Gender" })).not.toBeInTheDocument();
});
it("edits and removes filters and offers removed fields again", async () => {
	setup();
	await add("Player age", "Under 18");
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('"ageMax":17');
	fireEvent.click(screen.getByRole("button", { name: "Player age" }));
	fireEvent.change(screen.getByLabelText("Minimum age"), { target: { value: "45" } });
	fireEvent.change(screen.getByLabelText("Maximum age"), { target: { value: "" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('{"ageMin":45}');
	fireEvent.click(screen.getByRole("button", { name: "Remove Player age filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
	await add("Gender", "Male");
	fireEvent.click(screen.getByRole("button", { name: "Gender" }));
	fireEvent.click(screen.getByRole("option", { name: "All genders" }));
	expect(screen.queryByRole("button", { name: "Apply filters" })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Remove Gender filter" }));
	await add("Gender", "Female");
});
it("preserves applied filters while sessions are off and closes options", async () => {
	setup();
	await add("Gender", "Female");
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	fireEvent.click(screen.getByRole("button", { name: "Gender" }));
	fireEvent.click(screen.getByRole("button", { name: "Toggle sessions" }));
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Gender" })).toBeDisabled();
	expect(screen.getByTestId("filters")).toHaveTextContent('"gender":["Female"]');
	fireEvent.click(screen.getByRole("button", { name: "Toggle sessions" }));
	expect(screen.getByRole("button", { name: "Gender" })).toBeEnabled();
});
it("supports option keyboard navigation and Escape without closing the outer panel", async () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	const gender = screen.getByRole("option", { name: "Gender" });
	expect(gender).toHaveFocus();
	fireEvent.keyDown(gender, { key: "ArrowDown" });
	expect(screen.getByRole("option", { name: "Player skill level" })).toHaveFocus();
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
	expect(screen.getByRole("option", { name: "Player age" })).toHaveFocus();
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
	expect(gender).toHaveFocus();
	fireEvent.keyDown(gender, { key: "ArrowUp" });
	expect(screen.getByRole("option", { name: "Player age" })).toHaveFocus();
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Escape" });
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Add filter" })).toHaveFocus();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Close filter options" }));
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
it("shows empty results", async () => {
	setup("empty");
	await waitFor(() =>
		expect(screen.getByText("No demand matches these filters.")).toBeInTheDocument(),
	);
});
it.each(["options-fail", "sessions-fail"])("shows and retries %s", async (mode) => {
	const { fetchMock } = setup(mode);
	if (mode === "options-fail") {
		fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
		fireEvent.click(screen.getByRole("option", { name: "Gender" }));
	}
	const error =
		mode === "options-fail" ? "Couldn’t load player filters." : "Couldn’t load demand. Try again.";
	await waitFor(() => expect(screen.getByText(error)).toBeInTheDocument());
	fireEvent.click(screen.getByRole("button", { name: "Retry" }));
	await waitFor(() => expect(fetchMock.mock.calls.length).toBe(mode === "options-fail" ? 3 : 2));
});
it("handles a standalone control and loading options", () => {
	const client = new QueryClient();
	client.setQueryData(["app-session-filter-options"], { genders: [], skills: [], ages: [35] });
	vi.stubGlobal(
		"fetch",
		vi.fn(() => new Promise(() => {})),
	);
	renderWithMessages(
		<QueryClientProvider client={client}>
			<AppSessionFilters showSessions />
		</QueryClientProvider>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("option", { name: "Gender" }));
	expect(screen.getByRole("option", { name: "All genders" })).toBeInTheDocument();
	fireEvent.keyDown(screen.getByRole("button", { name: "Close filter options" }), {
		key: "ArrowDown",
	});
	fireEvent.click(screen.getByRole("button", { name: "Remove Gender filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("option", { name: "Player age" }));
	fireEvent.change(screen.getByLabelText("Minimum age"), { target: { value: "18" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	client.clear();
});

it("supports open and closed custom age bounds and rejects reversed bounds", async () => {
	setup();
	await add("Player age", "21+");
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('{"ageMin":21}');
	fireEvent.click(screen.getByRole("button", { name: "Player age" }));
	fireEvent.change(screen.getByLabelText("Minimum age"), { target: { value: "" } });
	fireEvent.change(screen.getByLabelText("Maximum age"), { target: { value: "17" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('{"ageMax":17}');
	fireEvent.change(screen.getByLabelText("Minimum age"), { target: { value: "18" } });
	expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
	fireEvent.change(screen.getByLabelText("Maximum age"), { target: { value: "35" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('{"ageMin":18,"ageMax":35}');
});

it("selects multiple genders and skills without closing their menus", async () => {
	setup();
	await add("Gender", "Female");
	fireEvent.click(screen.getByRole("button", { name: "Gender" }));
	fireEvent.click(screen.getByRole("option", { name: "Male" }));
	expect(screen.getByRole("option", { name: "Female" })).toHaveAttribute("aria-selected", "true");
	expect(screen.getByRole("option", { name: "Male" })).toHaveAttribute("aria-selected", "true");
	fireEvent.click(screen.getByRole("button", { name: "Close filter options" }));
	await add("Player skill level", "Advanced");
	fireEvent.click(screen.getByRole("button", { name: "Player skill level" }));
	fireEvent.click(screen.getByRole("option", { name: "Beginner" }));
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(JSON.parse(screen.getByTestId("filters").textContent ?? "{}")).toEqual({
		gender: ["Female", "Male"],
		skill: ["Advanced", "Beginner"],
	});
	fireEvent.click(screen.getByRole("option", { name: "Advanced" }));
	expect(screen.getByRole("option", { name: "Advanced" })).toHaveAttribute(
		"aria-selected",
		"false",
	);
});

it("orders stored skill levels by progression and shows age inputs without shortcuts", async () => {
	const { client } = setup();
	client.setQueryData(["app-session-filter-options"], {
		genders: [],
		skills: ["Expert", "Advanced", "Intermediate", "Beginner"],
		ages: [],
	});
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("option", { name: "Player skill level" }));
	expect(screen.getAllByRole("option").map((option) => option.textContent?.trim())).toEqual([
		"All skill levels✓",
		"Beginner",
		"Intermediate",
		"Advanced",
		"Expert",
	]);
	fireEvent.click(screen.getByRole("button", { name: "Close filter options" }));
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("option", { name: "Player age" }));
	expect(screen.getByLabelText("Minimum age")).toBeInTheDocument();
	expect(screen.getByLabelText("Maximum age")).toBeInTheDocument();
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

it("validates numeric age bounds and leaves input arrow keys available", async () => {
	setup();
	await add("Player age", "21+");
	fireEvent.click(screen.getByRole("button", { name: "Player age" }));
	fireEvent.keyDown(screen.getByRole("button", { name: "Close filter options" }), {
		key: "ArrowDown",
	});
	const min = screen.getByLabelText("Minimum age");
	const max = screen.getByLabelText("Maximum age");
	fireEvent.keyDown(min, { key: "ArrowUp" });
	fireEvent.change(min, { target: { value: "-1" } });
	expect(screen.getByRole("alert")).toBeInTheDocument();
	fireEvent.change(min, { target: { value: "121" } });
	expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
	fireEvent.change(min, { target: { value: "1.5" } });
	expect(screen.getByRole("alert")).toBeInTheDocument();
	fireEvent.change(min, { target: { value: "" } });
	fireEvent.change(max, { target: { value: "-1" } });
	expect(screen.getByRole("alert")).toBeInTheDocument();
	fireEvent.change(max, { target: { value: "121" } });
	expect(screen.getByRole("alert")).toBeInTheDocument();
	fireEvent.change(max, { target: { value: "1.5" } });
	expect(screen.getByRole("alert")).toBeInTheDocument();
	fireEvent.change(max, { target: { value: "17" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.queryByText("Applied: ≤ 17")).not.toBeInTheDocument();
});

it("preserves additional warehouse skill values after known levels", async () => {
	const { client } = setup();
	client.setQueryData(["app-session-filter-options"], {
		genders: [],
		skills: ["Unrated", "Other", "Expert", "Beginner"],
		ages: [],
	});
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("option", { name: "Player skill level" }));
	expect(
		screen
			.getAllByRole("option")
			.slice(1)
			.map((option) => option.textContent?.trim()),
	).toEqual(["Beginner", "Expert", "Other", "Unrated"]);
	fireEvent.click(screen.getByRole("option", { name: "Unrated" }));
	fireEvent.click(screen.getByRole("option", { name: "Unrated" }));
	fireEvent.click(screen.getByRole("button", { name: "Close filter options" }));
	await add("Player age", "21+");
	fireEvent.click(screen.getByRole("button", { name: "Player age" }));
	fireEvent.keyDown(screen.getByLabelText("Minimum age"), { key: "Escape" });
	expect(screen.queryByLabelText("Minimum age")).not.toBeInTheDocument();
});

it("capitalizes gender labels while submitting stored warehouse values", async () => {
	const { client } = setup();
	client.setQueryData(["app-session-filter-options"], {
		genders: ["female", "male", "other", "prefer not to say"],
		skills: [],
		ages: [],
	});
	await add("Gender", "Prefer not to say");
	fireEvent.click(screen.getByRole("button", { name: "Gender" }));
	expect(
		screen.getAllByRole("option").map((option) => option.textContent?.replace("✓", "").trim()),
	).toEqual(["All genders", "Female", "Male", "Other", "Prefer not to say"]);
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('"gender":["prefer not to say"]');
	expect(screen.queryByText("Applied: Prefer not to say")).not.toBeInTheDocument();
});
