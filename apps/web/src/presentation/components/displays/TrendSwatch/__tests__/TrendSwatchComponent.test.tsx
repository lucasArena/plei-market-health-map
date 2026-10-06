import { render, screen } from "@testing-library/react";
import { GAMES_TREND_COLORS } from "@/application/constants/games-trend-colors";
import { TrendSwatch } from "@/presentation/components/displays/TrendSwatch/TrendSwatchComponent";
import { SWATCH_TIP } from "@/presentation/components/displays/TrendSwatch/TrendSwatchComponent.rules";

describe("TrendSwatch", () => {
	it("draws the ring in the trend color with a tip up for up and down for down", () => {
		render(
			<>
				<TrendSwatch level="up" />
				<TrendSwatch level="stable" />
				<TrendSwatch level="down" className="size-4" />
			</>,
		);

		expect(screen.getByTestId("trend-swatch-tip-up")).toHaveAttribute("transform", "rotate(180)");
		expect(screen.getByTestId("trend-swatch-tip-up")).toHaveAttribute(
			"fill",
			GAMES_TREND_COLORS.up,
		);
		expect(screen.getByTestId("trend-swatch-tip-down")).toHaveAttribute("transform", "rotate(0)");
		expect(screen.getByTestId("trend-swatch-tip-down")).toHaveAttribute(
			"fill",
			GAMES_TREND_COLORS.down,
		);
		expect(screen.getByTestId("trend-swatch-down")).toHaveClass("size-4");
		expect(screen.getByTestId("trend-swatch-up")).toHaveClass("size-[18px]");
		expect(screen.getByTestId("trend-swatch-tip-stable")).toHaveAttribute(
			"transform",
			"rotate(-90)",
		);
		expect(screen.getByTestId("trend-swatch-stable").querySelectorAll("circle")[1]).toHaveAttribute(
			"stroke",
			GAMES_TREND_COLORS.stable,
		);
		expect(SWATCH_TIP).toBe("0,12 5.96,5.33 0,0 -5.96,5.33");
	});

	it("takes all three colors from the brand palette", () => {
		expect(GAMES_TREND_COLORS).toEqual({ up: "#86EFAC", down: "#F87171", stable: "#6B7280" });
	});
});
