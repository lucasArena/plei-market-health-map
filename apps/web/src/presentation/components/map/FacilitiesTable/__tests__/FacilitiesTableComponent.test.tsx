import { fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { FacilitiesTable } from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent";
import {
	buildFacilityRows,
	facilityStatus,
	formatFacilityChange,
	sortFacilityRows,
	visibleEntries,
} from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const setMapNavigation = vi.fn();

vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({ setMapNavigation }),
}));

const messages = EN_MESSAGES.facilitiesTable;
const percent = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

function facility(id: string, playedPrevious: number, played: number) {
	const change = played - playedPrevious;
	return {
		id,
		name: `Facility ${id}`,
		played,
		playedPrevious,
		change,
		changePercent: playedPrevious > 0 ? (change / playedPrevious) * 100 : null,
	};
}

const FACILITIES = [
	facility("a", 10, 20),
	facility("b", 10, 15),
	facility("c", 10, 12),
	facility("d", 10, 10),
	facility("e", 10, 8),
	facility("f", 276, 222),
	facility("g", 0, 0),
];

describe("FacilitiesTable rules", () => {
	it("rates a facility by how much its games fell", () => {
		expect(facilityStatus(8, 10)).toBe("attention");
		expect(facilityStatus(222, 276)).toBe("attention");
		expect(facilityStatus(9, 10)).toBe("watch");
		expect(facilityStatus(10, 10)).toBe("onTrack");
		expect(facilityStatus(4, 0)).toBe("onTrack");
	});

	it("labels the change, new facilities and empty ones", () => {
		expect(formatFacilityChange(facility("a", 10, 15), messages, percent)).toEqual({
			label: "+50%",
			direction: "up",
		});
		expect(formatFacilityChange(facility("a", 10, 5), messages, percent)).toEqual({
			label: "−50%",
			direction: "down",
		});
		expect(formatFacilityChange(facility("a", 10, 10), messages, percent)).toEqual({
			label: "0%",
			direction: "flat",
		});
		expect(formatFacilityChange(facility("a", 0, 3), messages, percent)).toEqual({
			label: "New",
			direction: "up",
		});
		expect(formatFacilityChange(facility("a", 0, 0), messages, percent)).toBeNull();
	});

	it("drops facilities with no games and orders the rest from biggest gain to biggest drop", () => {
		const rows = sortFacilityRows(buildFacilityRows(FACILITIES, messages, "en"));

		expect(rows.map((row) => row.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
		expect(rows[5]).toMatchObject({
			statusLabel: "Needs attention",
			previousLabel: "vs 276",
			gamesLabel: "222",
			openLabel: "Open Facility f",
		});
	});

	it("shows the top three and the bottom two until expanded", () => {
		const rows = sortFacilityRows(buildFacilityRows(FACILITIES, messages, "en"));

		expect(visibleEntries(rows, false).map((entry) => entry.key)).toEqual([
			"a",
			"b",
			"c",
			"gap",
			"e",
			"f",
		]);
		expect(visibleEntries(rows, true)).toHaveLength(6);
		expect(visibleEntries(rows.slice(0, 5), false)).toHaveLength(5);
	});
});

describe("FacilitiesTable", () => {
	it("lists the market's facilities, expands them and opens one", () => {
		render(
			<MessagesProvider locale="en" messages={EN_MESSAGES}>
				<FacilitiesTable facilities={FACILITIES} marketName="Houston" />
			</MessagesProvider>,
		);

		const table = screen.getByRole("region", { name: "Facilities" });
		expect(table).toHaveTextContent("6");
		expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(5);
		expect(screen.getByTestId("facilities-table-gap")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Show all 6 facilities" }));
		expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(6);
		expect(screen.queryByTestId("facilities-table-gap")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
		expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(5);

		fireEvent.click(screen.getByRole("button", { name: "Open Facility f" }));
		expect(setMapNavigation).toHaveBeenCalledWith({
			kind: "facility",
			id: "f",
			name: "Facility f",
			marketName: "Houston",
		});
	});

	it("hides the toggle when every facility fits", () => {
		render(
			<MessagesProvider locale="en" messages={EN_MESSAGES}>
				<FacilitiesTable facilities={FACILITIES.slice(0, 2)} marketName="Houston" />
			</MessagesProvider>,
		);

		expect(screen.queryByRole("button", { name: /Show all/ })).not.toBeInTheDocument();
		expect(screen.getByText("Facility a").closest("li")).not.toHaveClass("border-t");
		expect(screen.getByText("Facility b").closest("li")).toHaveClass("border-t");
	});
});
