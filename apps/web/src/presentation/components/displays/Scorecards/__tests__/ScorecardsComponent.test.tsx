import { render, screen } from "@testing-library/react";
import { Scorecards } from "@/presentation/components/displays/Scorecards/ScorecardsComponent";

const CARD = { label: "Games played", info: "i", value: "48", change: null };

describe("Scorecards", () => {
	it("leads with games played and pairs the two rates below", () => {
		render(
			<Scorecards
				title="Scorecards"
				played={CARD}
				confirmation={{ ...CARD, label: "Confirmation rate", value: "75%" }}
				cancellation={{ ...CARD, label: "Cancellation rate", value: "11%" }}
			/>,
		);

		const group = screen.getByRole("region", { name: "Scorecards" });
		expect(group).toContainElement(screen.getByTestId("score-played"));
		expect(screen.getByTestId("score-confirmation")).toHaveTextContent("75%");
		expect(screen.getByTestId("score-cancellation")).toHaveTextContent("11%");
	});
});
