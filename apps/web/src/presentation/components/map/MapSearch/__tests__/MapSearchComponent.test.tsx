import type { PlaceView } from "@market-health-map/core/application";
import { act, fireEvent, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MapSearch } from "@/presentation/components/map/MapSearch/MapSearchComponent";
import { buildMarketSearchResults } from "@/presentation/components/map/MapSearch/MapSearchComponent.rules";

const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined);
const mockOnPlaceSelect = vi.fn();
const mockPlaceSearch = vi.fn(
	(_query: string): { data: PlaceView[] | undefined; isFetching: boolean } => ({
		data: undefined,
		isFetching: false,
	}),
);

vi.mock("@/presentation/hooks/use-place/use-place-search", () => ({
	usePlaceSearch: (query: string) => mockPlaceSearch(query),
}));

const WICHITA = {
	id: "R123",
	name: "Wichita",
	kind: "city" as const,
	context: "Kansas, United States",
	location: { latitude: 37.69, longitude: -97.34 },
	bounds: [-97.73, 37.48, -97.15, 37.84] as [number, number, number, number],
};

vi.mock("@tanstack/react-query", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-query")>()),
	useQueryClient: () => ({ prefetchQuery: mockPrefetchQuery }),
}));

const FACILITIES = [
	{
		id: "a1",
		marketId: "austin",
		marketName: "Austin",
		name: "Eastside Futsal Arena",
		avatarUrl: null,
		isActive: true,
		isActiveLastWeek: true,
		location: { latitude: 30.27, longitude: -97.74 },
	},
	{
		id: "a2",
		marketId: "austin",
		marketName: "Austin",
		name: "Northside Soccer Center",
		avatarUrl: null,
		isActive: false,
		isActiveLastWeek: false,
		location: { latitude: 30.4, longitude: -97.7 },
	},
	{
		id: "m1",
		marketId: "miami",
		marketName: "Miami",
		name: "Beach Field House",
		avatarUrl: null,
		isActive: true,
		isActiveLastWeek: true,
		location: { latitude: 25.76, longitude: -80.19 },
	},
];

describe("buildMarketSearchResults", () => {
	it("groups facilities by market and sorts markets by name", () => {
		const markets = buildMarketSearchResults(FACILITIES, FACILITIES);
		expect(markets.map((market) => market.name)).toEqual(["Austin", "Miami"]);
		expect(markets[0]?.facilities).toHaveLength(2);
	});

	it("keeps every market but gives each only its shown facilities", () => {
		const shown = FACILITIES.slice(0, 1);
		const markets = buildMarketSearchResults(FACILITIES, shown);
		expect(markets).toEqual([
			{ id: "austin", name: "Austin", facilities: shown },
			{ id: "miami", name: "Miami", facilities: [] },
		]);
	});
});

describe("MapSearch", () => {
	it("searches grouped markets and facilities and selects either kind", () => {
		const onFacilitySelect = vi.fn();
		const onMarketSelect = vi.fn();
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={onFacilitySelect}
				onMarketSelect={onMarketSelect}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets, facilities or cities" });

		fireEvent.focus(input);
		expect(screen.getByText("Markets")).toHaveClass(
			"text-[12px]",
			"font-semibold",
			"tracking-normal",
			"text-muted-foreground/90",
		);
		expect(screen.getByText("Markets")).not.toHaveClass("uppercase");
		expect(screen.getByText("Facilities")).toHaveClass(
			"text-[12px]",
			"font-semibold",
			"tracking-normal",
			"text-muted-foreground/90",
		);
		expect(screen.getByText("Facilities")).not.toHaveClass("uppercase");
		expect(
			screen.getByRole("option", { name: /Austin.*2 facilities/ }).querySelector("span"),
		).toHaveClass("text-sm", "font-medium");
		expect(
			screen.getByRole("option", { name: /Eastside Futsal Arena/ }).querySelector("span"),
		).toHaveClass("text-sm", "font-medium");
		fireEvent.change(input, { target: { value: "Austin" } });
		expect(screen.getByRole("option", { name: /Austin.*2 facilities/ })).toBeInTheDocument();
		expect(screen.queryByText("Miami")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("option", { name: /Austin.*2 facilities/ }));
		expect(onMarketSelect).toHaveBeenCalledWith(
			expect.objectContaining({ id: "austin", facilities: [FACILITIES[0], FACILITIES[1]] }),
		);
		expect(input).toHaveValue("Austin");

		fireEvent.change(input, { target: { value: "Beach" } });
		fireEvent.click(screen.getByRole("option", { name: /Beach Field House.*Miami/ }));
		expect(onFacilitySelect).toHaveBeenCalledWith(FACILITIES[2]);
		expect(input).toHaveValue("Beach Field House");
	});

	it("counts and lists only the facilities the map layers show", () => {
		const onMarketSelect = vi.fn();
		const activeFacilities = FACILITIES.filter((facility) => facility.isActive);
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={activeFacilities}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={onMarketSelect}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		fireEvent.focus(screen.getByRole("combobox", { name: "Search markets, facilities or cities" }));

		expect(screen.getByRole("option", { name: /Austin.*1 facility$/ })).toBeInTheDocument();
		expect(screen.queryByRole("option", { name: /Northside Soccer Center/ })).toBeNull();
		fireEvent.click(screen.getByRole("option", { name: /Austin.*1 facility$/ }));
		expect(onMarketSelect).toHaveBeenCalledWith(
			expect.objectContaining({ id: "austin", facilities: [FACILITIES[0]] }),
		);
	});

	it("still lists a market whose facilities are all hidden", () => {
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={[]}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		fireEvent.focus(screen.getByRole("combobox", { name: "Search markets, facilities or cities" }));

		expect(screen.getByRole("option", { name: /Miami.*0 facilities/ })).toBeInTheDocument();
		expect(screen.queryByText("Facilities")).toBeNull();
	});

	it("clears, closes, and reports an empty result once the city lookup settles", async () => {
		const onClear = vi.fn();
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={onClear}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets, facilities or cities" });
		fireEvent.change(input, { target: { value: "nowhere" } });
		expect(screen.queryByText("No markets, facilities or cities found")).not.toBeInTheDocument();
		expect(screen.getByRole("listbox")).toHaveTextContent("Searching cities…");
		expect(await screen.findByText("No markets, facilities or cities found")).toBeInTheDocument();

		expect(onClear).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
		expect(input).toHaveValue("");
		expect(onClear).toHaveBeenCalledOnce();
		fireEvent.change(input, { target: { value: "Mi" } });
		fireEvent.change(input, { target: { value: " " } });
		expect(onClear).toHaveBeenCalledTimes(2);
		vi.useFakeTimers();
		fireEvent.keyDown(input, { key: "Escape" });
		expect(screen.getByRole("listbox")).toHaveClass("search-results-out");
		act(() => {
			vi.advanceTimersByTime(160);
		});
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

		fireEvent.focus(input);
		expect(screen.getByRole("listbox")).toHaveClass("search-results-in");
		fireEvent.pointerDown(document.body);
		expect(screen.getByRole("listbox")).toHaveClass("search-results-out");
		act(() => {
			vi.advanceTimersByTime(160);
		});
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		vi.useRealTimers();
	});

	it("stays open for other keys and for pointer events inside the search", () => {
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets, facilities or cities" });
		fireEvent.focus(input);
		fireEvent.keyDown(input, { key: "ArrowDown" });
		expect(screen.getByRole("listbox")).toBeInTheDocument();

		fireEvent.pointerDown(input);
		expect(screen.getByRole("listbox")).toBeInTheDocument();
	});

	it("flows inside the header row instead of floating over it", () => {
		const { container } = renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets, facilities or cities" });
		fireEvent.focus(input);

		const root = container.firstElementChild;
		expect(root).toHaveClass("relative", "w-full", "max-w-96", "min-w-0");
		expect(root).not.toHaveClass("absolute");
		expect(screen.getByRole("listbox")).toHaveClass("absolute", "top-full");
	});

	it("draws the field and the results on the shared glass surface", () => {
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets, facilities or cities" });
		fireEvent.focus(input);

		expect(input.parentElement).toHaveClass(
			"h-[32px]",
			"rounded-full",
			"map-glass",
			"shadow-[var(--map-shadow)]",
		);
		expect(input).toHaveClass("text-map-icon", "placeholder:text-map-icon");
		expect(input.parentElement?.querySelector("img")).toHaveAttribute(
			"src",
			expect.stringContaining("search.svg"),
		);
		expect(screen.getByRole("listbox")).toHaveClass(
			"map-glass",
			"shadow-[var(--map-shadow)]",
			"search-results-in",
			"overflow-y-auto",
		);
	});

	it("loads a market or facility once the pointer rests on it, not while skimming", () => {
		vi.useFakeTimers();
		mockPrefetchQuery.mockClear();
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		fireEvent.focus(screen.getByRole("combobox", { name: "Search markets, facilities or cities" }));
		const austin = screen.getByRole("option", { name: /Austin.*2 facilities/ });
		const facility = screen.getByRole("option", { name: /Eastside Futsal Arena/ });

		fireEvent.pointerEnter(austin);
		act(() => vi.advanceTimersByTime(100));
		fireEvent.pointerLeave(austin);
		act(() => vi.advanceTimersByTime(200));
		expect(mockPrefetchQuery).not.toHaveBeenCalled();

		fireEvent.pointerEnter(austin);
		act(() => vi.advanceTimersByTime(150));
		expect(mockPrefetchQuery.mock.calls[0]?.[0].queryKey).toEqual([
			"market-summary",
			"reservations",
			"austin",
		]);

		mockPrefetchQuery.mockClear();
		fireEvent.focus(facility);
		act(() => vi.advanceTimersByTime(150));
		expect(mockPrefetchQuery.mock.calls.map(([options]) => options.queryKey.at(-1))).toEqual([
			"reservations",
			"players",
		]);
		vi.useRealTimers();
	});

	it("looks up cities after a pause, lists them after local results and selects one", () => {
		vi.useFakeTimers();
		mockPlaceSearch.mockImplementation((query: string) => ({
			data: query === "wichita" ? [WICHITA] : undefined,
			isFetching: false,
		}));
		renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets, facilities or cities" });

		expect(input).toHaveAttribute("autocomplete", "off");
		expect(screen.queryByRole("status", { name: "Searching cities…" })).not.toBeInTheDocument();
		fireEvent.change(input, { target: { value: "wichita" } });
		expect(screen.queryByText("No markets, facilities or cities found")).not.toBeInTheDocument();
		expect(screen.queryByText("Cities and places")).not.toBeInTheDocument();
		expect(screen.getByRole("status", { name: "Searching cities…" })).toContainElement(
			screen.getByTestId("map-search-spinner"),
		);
		act(() => vi.advanceTimersByTime(300));
		expect(screen.queryByRole("status", { name: "Searching cities…" })).not.toBeInTheDocument();

		expect(screen.getByText("Cities and places")).toBeInTheDocument();
		expect(
			screen.getByText("Places from Photon · © OpenStreetMap contributors"),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("option", { name: /Wichita.*Kansas, United States/ }));
		expect(mockOnPlaceSelect).toHaveBeenCalledWith(WICHITA);
		expect(input).toHaveValue("Wichita");
		vi.useRealTimers();
		mockPlaceSearch.mockReset();
		mockPlaceSearch.mockImplementation(() => ({ data: undefined, isFetching: false }));
	});

	it("separates cities from facilities, shows nameless context gracefully and reports no results", () => {
		vi.useFakeTimers();
		mockPlaceSearch.mockImplementation(() => ({
			data: [
				{ ...WICHITA, id: "N1", name: "Eastside", context: "" },
				{ ...WICHITA, id: "R9", kind: "county" as const },
			],
			isFetching: false,
		}));
		const { container } = renderWithMessages(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onPlaceSelect={mockOnPlaceSelect}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets, facilities or cities" });
		fireEvent.change(input, { target: { value: "Eastside" } });
		act(() => vi.advanceTimersByTime(300));

		expect(container.querySelector('[aria-labelledby="map-search-places"]')).toHaveClass(
			"border-t",
		);
		expect(screen.getByRole("option", { name: "Eastside" })).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: /Wichita.*County · Kansas, United States/ }),
		).toBeInTheDocument();
		mockPlaceSearch.mockImplementation(() => ({ data: [], isFetching: false }));
		fireEvent.change(input, { target: { value: "nowhere" } });
		act(() => vi.advanceTimersByTime(300));
		expect(screen.getByText("No markets, facilities or cities found")).toBeInTheDocument();
		vi.useRealTimers();
		mockPlaceSearch.mockImplementation(() => ({ data: undefined, isFetching: false }));
	});
});
