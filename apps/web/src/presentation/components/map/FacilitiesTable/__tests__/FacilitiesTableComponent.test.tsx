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
	facility("h", 30, 2),
	facility("i", 10, 9),
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

		expect(rows.map((row) => row.id)).toEqual(["a", "b", "c", "d", "i", "e", "h", "f"]);
		expect(rows[7]).toMatchObject({
			statusLabel: "Needs attention",
			previousLabel: "vs 276",
			gamesLabel: "222",
			openLabel: "Open Facility f",
		});
	});

	it("shows the three best and three worst, labelled, until expanded", () => {
		const rows = sortFacilityRows(buildFacilityRows(FACILITIES, messages, "en"));
		const collapsed = visibleEntries(rows, false, messages);

		expect(collapsed.map((entry) => entry.key)).toEqual([
			"top",
			"a",
			"b",
			"c",
			"gap",
			"bottom",
			"e",
			"h",
			"f",
		]);
		expect(collapsed[4]).toEqual({ kind: "gap", key: "gap", label: "2 more in between" });
		expect(collapsed[0]).toEqual({ kind: "label", key: "top", label: "Biggest gains" });
		expect(visibleEntries(rows, true, messages)).toHaveLength(8);
		expect(visibleEntries(rows.slice(0, 6), false, messages)).toHaveLength(6);
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
		expect(table).toHaveTextContent("8");
		expect(table).toHaveTextContent("Biggest gains");
		expect(table).toHaveTextContent("Biggest drops");
		expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(6);

		fireEvent.click(screen.getByRole("button", { name: "2 more in between" }));
		expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(8);
		expect(screen.queryByTestId("facilities-table-gap")).not.toBeInTheDocument();
		expect(table).not.toHaveTextContent("Biggest gains");
		fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
		expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(6);
		fireEvent.click(screen.getByRole("button", { name: "Show all 8 facilities" }));
		expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(8);

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
