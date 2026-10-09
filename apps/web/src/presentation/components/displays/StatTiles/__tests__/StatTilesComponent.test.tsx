import { render, screen } from "@testing-library/react";
import { StatTiles } from "@/presentation/components/displays/StatTiles/StatTilesComponent";
import { METRIC_LABEL_CLASS } from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";

describe("StatTiles", () => {
	it("renders values, colored hints and per-tile skeletons", () => {
		render(
			<StatTiles
				testIdPrefix="market-stat"
				tiles={[
					{
						key: "played",
						label: "Games played",
						value: "1,204",
						hint: "-3% vs previous period",
						hintDirection: "down",
						isLoading: false,
					},
					{
						key: "players",
						label: "Unique players",
						value: "",
						hint: null,
						hintDirection: "flat",
						isLoading: true,
					},
				]}
			/>,
		);

		expect(screen.getByText("Games played")).toBeInTheDocument();
		expect(screen.getByText("1,204")).toBeInTheDocument();
		expect(screen.getByText("-3% vs previous period")).toHaveClass("text-red-600");
		expect(screen.getByTestId("market-stat-players-skeleton")).toBeInTheDocument();
	});

	it("keeps cards by default and drops the tile chrome when flat", () => {
		const tile = {
			key: "played",
			label: "Games played",
			value: "1,204",
			hint: null,
			hintDirection: "flat" as const,
			isLoading: false,
		};
		const { rerender } = render(<StatTiles testIdPrefix="t" tiles={[tile]} />);
		expect(screen.getByText("1,204").parentElement).toHaveClass("rounded-xl", "border", "bg-card");

		rerender(<StatTiles testIdPrefix="t" tiles={[tile]} isFlat />);
		const flatTile = screen.getByText("1,204").parentElement;
		expect(flatTile).not.toHaveClass("rounded-xl");
		expect(flatTile).not.toHaveClass("bg-card");
		expect(flatTile?.parentElement).toHaveClass("gap-x-2", "gap-y-4");
	});

	it("uses the shared metric label style for flat tiles", () => {
		const tile = {
			key: "players",
			label: "Unique players",
			value: "120",
			hint: null,
			hintDirection: "flat" as const,
			isLoading: false,
		};
		const { rerender } = render(<StatTiles testIdPrefix="t" tiles={[tile]} isFlat />);
		expect(screen.getByText("Unique players")).toHaveClass(...METRIC_LABEL_CLASS.split(" "));
		rerender(<StatTiles testIdPrefix="t" tiles={[tile]} />);
		expect(screen.getByText("Unique players")).toHaveClass("text-xs");
	});
});
