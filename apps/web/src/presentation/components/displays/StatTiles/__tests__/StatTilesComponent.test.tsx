import { render, screen } from "@testing-library/react";
import { StatTiles } from "@/presentation/components/displays/StatTiles/StatTilesComponent";

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
});
