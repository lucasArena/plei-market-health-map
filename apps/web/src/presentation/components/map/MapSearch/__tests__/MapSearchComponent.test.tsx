import { fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MapSearch } from "@/presentation/components/map/MapSearch/MapSearchComponent";
import { buildMarketSearchResults } from "@/presentation/components/map/MapSearch/MapSearchComponent.rules";

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
		const markets = buildMarketSearchResults(FACILITIES);
		expect(markets.map((market) => market.name)).toEqual(["Austin", "Miami"]);
		expect(markets[0]?.facilities).toHaveLength(2);
	});
});

describe("MapSearch", () => {
	it("searches grouped markets and facilities and selects either kind", () => {
		const onFacilitySelect = vi.fn();
		const onMarketSelect = vi.fn();
		render(
			<MapSearch
				facilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={onFacilitySelect}
				onMarketSelect={onMarketSelect}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });

		fireEvent.focus(input);
		expect(screen.getByText("Markets")).toBeInTheDocument();
		expect(screen.getByText("Facilities")).toBeInTheDocument();
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

	it("clears, closes, and reports an empty result", () => {
		render(
			<MapSearch
				facilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });
		fireEvent.change(input, { target: { value: "nowhere" } });
		expect(screen.getByText("No markets or facilities found")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
		expect(input).toHaveValue("");
		fireEvent.keyDown(input, { key: "Escape" });
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

		fireEvent.focus(input);
		fireEvent.pointerDown(document.body);
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("stays open for other keys and for pointer events inside the search", () => {
		render(
			<MapSearch
				facilities={FACILITIES}
				messages={EN_MESSAGES.map}
				onFacilitySelect={vi.fn()}
				onMarketSelect={vi.fn()}
			/>,
		);
		const input = screen.getByRole("combobox", { name: "Search markets or facilities" });
		fireEvent.focus(input);
		fireEvent.keyDown(input, { key: "ArrowDown" });
		expect(screen.getByRole("listbox")).toBeInTheDocument();

		fireEvent.pointerDown(input);
		expect(screen.getByRole("listbox")).toBeInTheDocument();
	});
});
