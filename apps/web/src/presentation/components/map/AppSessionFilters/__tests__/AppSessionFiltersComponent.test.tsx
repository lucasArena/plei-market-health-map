import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { AppSessionFilters } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent";
import {
	MapLayersProvider,
	useMapLayers,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

function LayerState() {
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
			? { genders: ["Female", "Male"], skills: ["Advanced", "Beginner"] }
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
				<LayerState />
			</MapLayersProvider>
		</QueryClientProvider>,
	);
	return { fetchMock, client, ...rendered };
}
afterEach(() => vi.unstubAllGlobals());
it("applies one combined cohort, keeps draft edits off the map, and resets", async () => {
	const { fetchMock } = setup();
	await waitFor(() => expect(screen.getByLabelText("Gender")).toBeEnabled());
	expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
	fireEvent.change(screen.getByLabelText("Gender"), { target: { value: "Female" } });
	fireEvent.change(screen.getByLabelText("Player skill level"), { target: { value: "Advanced" } });
	fireEvent.change(screen.getByLabelText("Player age"), { target: { value: "25" } });
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
	expect(screen.getByText("Pending changes")).toBeInTheDocument();
	expect(fetchMock.mock.calls.filter(([url]) => !url.endsWith("/filters"))).toHaveLength(1);
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
	expect(screen.getByTestId("filters")).toHaveTextContent('"ageMin":25,"ageMax":34');
	expect(screen.getByText("Applied: Female · Advanced · 25–34")).toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
	expect(screen.getByLabelText("Gender")).toHaveValue("");
	expect(screen.getByLabelText("Player age")).toHaveValue("all");
});
it("supports inclusive under-18 and open 45+ bounds and clearing fields", async () => {
	setup();
	await waitFor(() => expect(screen.getByLabelText("Gender")).toBeEnabled());
	fireEvent.change(screen.getByLabelText("Player age"), { target: { value: "under18" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('"ageMin":0,"ageMax":17');
	fireEvent.change(screen.getByLabelText("Player age"), { target: { value: "45" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent('{"ageMin":45}');
	fireEvent.change(screen.getByLabelText("Gender"), { target: { value: "Male" } });
	fireEvent.change(screen.getByLabelText("Gender"), { target: { value: "" } });
	expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
	fireEvent.change(screen.getByLabelText("Player age"), { target: { value: "all" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.getByTestId("filters")).toHaveTextContent("{}");
});
it("preserves applied filters and disables editing while sessions are off", async () => {
	setup();
	await waitFor(() => expect(screen.getByLabelText("Gender")).toBeEnabled());
	fireEvent.change(screen.getByLabelText("Gender"), { target: { value: "Female" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	fireEvent.click(screen.getByRole("button", { name: "Toggle sessions" }));
	expect(screen.getByLabelText("Player age")).toBeDisabled();
	expect(screen.getByTestId("filters")).toHaveTextContent('"gender":"Female"');
	fireEvent.click(screen.getByRole("button", { name: "Toggle sessions" }));
	expect(screen.getByLabelText("Gender")).toBeEnabled();
});
it("reports an empty result", async () => {
	setup("empty");
	await waitFor(() =>
		expect(screen.getByText("No sessions match these filters.")).toBeInTheDocument(),
	);
});
it.each(["options-fail", "sessions-fail"])("shows and retries %s", async (mode) => {
	const { fetchMock } = setup(mode);
	const error =
		mode === "options-fail"
			? "Couldn’t load player filters."
			: "Couldn’t load sessions. Try again.";
	await waitFor(() => expect(screen.getByText(error)).toBeInTheDocument());
	expect(screen.queryByText("No sessions match these filters.")).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Retry" }));
	await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
});
it("shows loading and handles a standalone control", () => {
	const client = new QueryClient();
	vi.stubGlobal(
		"fetch",
		vi.fn(() => new Promise(() => {})),
	);
	renderWithMessages(
		<QueryClientProvider client={client}>
			<AppSessionFilters showSessions />
		</QueryClientProvider>,
	);
	expect(screen.getByText("Loading player filters…")).toBeInTheDocument();
	expect(screen.getByText("Updating sessions…")).toBeInTheDocument();
	fireEvent.change(screen.getByLabelText("Player age"), { target: { value: "35" } });
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	client.clear();
});
