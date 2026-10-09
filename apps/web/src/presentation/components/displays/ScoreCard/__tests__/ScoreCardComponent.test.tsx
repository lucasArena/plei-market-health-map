import { render, screen } from "@testing-library/react";
import { ScoreCard } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent";

describe("ScoreCard", () => {
	it("leads with the main metric, its colored change and the comparison", () => {
		render(
			<ScoreCard
				testId="score-played"
				size="primary"
				label="Games played"
				info="Games that happened."
				aside="Main metric"
				value="48"
				change={{ label: "−20%", tone: "bad" }}
				caption="vs 60 in the previous 28 days"
			/>,
		);

		const card = screen.getByRole("region", { name: "Games played" });
		expect(card).toHaveTextContent("Games playedMain metric48−20%vs 60 in the previous 28 days");
		expect(screen.getByText("−20%")).toHaveClass("text-[#b91c1c]");
		expect(screen.getByRole("img", { name: "Games that happened." })).toHaveAttribute(
			"title",
			"Games that happened.",
		);
	});

	it("shows a rate with its point change below", () => {
		render(
			<ScoreCard
				testId="score-confirmation"
				label="Confirmation rate"
				info="Played over posted."
				value="75%"
				change={{ label: "+3 pts vs previous period", tone: "good" }}
			/>,
		);

		expect(screen.getByText("+3 pts vs previous period")).toHaveClass("text-[#15803d]");
		expect(screen.getByText("75%")).toHaveClass("text-2xl");
	});

	it("leaves out a missing change", () => {
		render(
			<ScoreCard testId="score-x" size="primary" label="X" info="i" value="0" change={null} />,
		);

		expect(screen.getByTestId("score-x")).toHaveTextContent(/^X0$/);
	});
});
