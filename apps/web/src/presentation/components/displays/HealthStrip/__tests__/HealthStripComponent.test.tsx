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
});
