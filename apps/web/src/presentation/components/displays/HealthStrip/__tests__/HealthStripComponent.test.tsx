import { render, screen } from "@testing-library/react";
import { HealthStrip } from "@/presentation/components/displays/HealthStrip/HealthStripComponent";

describe("HealthStrip", () => {
	it("frames the market health insight", () => {
		render(
			<HealthStrip>
				<p>Pegaso Soccer Miami needs attention.</p>
			</HealthStrip>,
		);

		expect(screen.getByTestId("health-strip")).toHaveTextContent(
			"Pegaso Soccer Miami needs attention.",
		);
	});

	it("tints the strip red, gray or green by tone", () => {
		const { rerender } = render(
			<HealthStrip tone="attention">
				<p>Down</p>
			</HealthStrip>,
		);
		expect(screen.getByTestId("health-strip")).toHaveClass("bg-[#fef2f2]", "border-[#fecaca]");

		rerender(
			<HealthStrip tone="stable">
				<p>Flat</p>
			</HealthStrip>,
		);
		expect(screen.getByTestId("health-strip")).toHaveAttribute("data-tone", "stable");

		rerender(
			<HealthStrip tone="growing">
				<p>Up</p>
			</HealthStrip>,
		);
		expect(screen.getByTestId("health-strip")).toHaveClass("bg-[#f0fdf4]");
	});
});
