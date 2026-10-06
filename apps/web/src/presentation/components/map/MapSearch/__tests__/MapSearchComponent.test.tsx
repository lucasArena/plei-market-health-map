import { act, fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MapSearch } from "@/presentation/components/map/MapSearch/MapSearchComponent";
import { buildMarketSearchResults } from "@/presentation/components/map/MapSearch/MapSearchComponent.rules";

const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined);

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
		location: { latitude: 30.27, longitude: -97.74 },
	},
	{
		id: "a2",
		marketId: "austin",
		marketName: "Austin",
		name: "Northside Soccer Center",
		avatarUrl: null,
		isActive: false,
		location: { latitude: 30.4, longitude: -97.7 },
	},
	{
		id: "m1",
		marketId: "miami",
		marketName: "Miami",
		name: "Beach Field House",
		avatarUrl: null,
		isActive: true,
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
		render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={onFacilitySelect}
				onMarketSelect={onMarketSelect}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });

		fireEvent.focus(input);
		expect(screen.getByText("Markets")).toHaveClass(
			"text-[10px]",
			"font-semibold",
			"tracking-wider",
			"text-muted-foreground",
			"uppercase",
		);
		expect(screen.getByText("Facilities")).toHaveClass(
			"text-[10px]",
			"font-semibold",
			"tracking-wider",
			"text-muted-foreground",
			"uppercase",
		);
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
		render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={activeFacilities}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={onMarketSelect}
				onClear={vi.fn()}
			/>,
		);
		fireEvent.focus(screen.getByRole("combobox", { name: "Search markets or facilities" }));

		expect(screen.getByRole("option", { name: /Austin.*1 facilities/ })).toBeInTheDocument();
		expect(screen.queryByRole("option", { name: /Northside Soccer Center/ })).toBeNull();
		fireEvent.click(screen.getByRole("option", { name: /Austin.*1 facilities/ }));
		expect(onMarketSelect).toHaveBeenCalledWith(
			expect.objectContaining({ id: "austin", facilities: [FACILITIES[0]] }),
		);
	});

	it("still lists a market whose facilities are all hidden", () => {
		render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={[]}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onClear={vi.fn()}
			/>,
		);
		fireEvent.focus(screen.getByRole("combobox", { name: "Search markets or facilities" }));

		expect(screen.getByRole("option", { name: /Miami.*0 facilities/ })).toBeInTheDocument();
		expect(screen.queryByText("Facilities")).toBeNull();
	});

	it("clears, closes, and reports an empty result", () => {
		const onClear = vi.fn();
		render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onClear={onClear}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });
		fireEvent.change(input, { target: { value: "nowhere" } });
		expect(screen.getByText("No markets or facilities found")).toBeInTheDocument();

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
		render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });
		fireEvent.focus(input);
		fireEvent.keyDown(input, { key: "ArrowDown" });
		expect(screen.getByRole("listbox")).toBeInTheDocument();

		fireEvent.pointerDown(input);
		expect(screen.getByRole("listbox")).toBeInTheDocument();
	});

	it("flows inside the header row instead of floating over it", () => {
		const { container } = render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });
		fireEvent.focus(input);

		const root = container.firstElementChild;
		expect(root).toHaveClass("relative", "w-full", "max-w-96", "min-w-0");
		expect(root).not.toHaveClass("absolute");
		expect(screen.getByRole("listbox")).toHaveClass("absolute", "top-full");
	});

	it("draws the field and the results on the shared glass surface", () => {
		render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onClear={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });
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
		render(
			<MapSearch
				facilities={FACILITIES}
				shownFacilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
				onClear={vi.fn()}
			/>,
		);
		fireEvent.focus(screen.getByRole("combobox", { name: "Search markets or facilities" }));
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
});
