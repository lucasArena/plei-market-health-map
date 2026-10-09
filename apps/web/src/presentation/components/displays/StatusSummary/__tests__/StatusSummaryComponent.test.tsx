import { render, screen } from "@testing-library/react";
import { StatusSummary } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent";

describe("StatusSummary", () => {
	it("shows the status, the headline and the drivers in the tone's colors", () => {
		render(
			<StatusSummary
				tone="attention"
				label="Needs attention"
				headline="Miami Metro: down 3 weeks in a row, driven by 2 facilities."
				detail="Pegaso (14 → 8) and Doral (11 → 6) account for 11 of the 12 games lost."
			/>,
		);

		const summary = screen.getByTestId("status-summary");
		expect(summary).toHaveAttribute("data-tone", "attention");
		expect(summary).toHaveClass("bg-[#fef2f2]");
		expect(summary).toHaveTextContent("Needs attention");
		expect(screen.getByText(/account for 11 of the 12/)).toBeInTheDocument();
	});

	it("leaves out the detail line when there is none", () => {
		render(<StatusSummary tone="onTrack" label="On track" headline="Steady." detail={null} />);

		expect(screen.getByTestId("status-summary").querySelectorAll("p")).toHaveLength(1);
	});
});
