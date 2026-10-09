import { render, screen } from "@testing-library/react";
import { PanelSection } from "@/presentation/components/displays/PanelSection/PanelSectionComponent";

describe("PanelSection", () => {
	it("titles a group of metrics as a labelled region", () => {
		render(
			<PanelSection title="Games" aside="Weekly · last 8 weeks" testId="panel-section-games">
				<p>1,169 games</p>
			</PanelSection>,
		);

		const section = screen.getByRole("region", { name: "Games" });
		expect(section).toHaveAttribute("data-testid", "panel-section-games");
		expect(screen.getByRole("heading", { name: "Games" })).toBeInTheDocument();
		expect(section).toHaveTextContent("1,169 games");
		expect(screen.getByText("Weekly · last 8 weeks")).toBeInTheDocument();
	});
});
