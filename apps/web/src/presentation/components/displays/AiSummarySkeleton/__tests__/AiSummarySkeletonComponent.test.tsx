import { screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { AiSummarySkeleton } from "@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent";

describe("AiSummarySkeleton", () => {
	it("looks like the AI box while it loads: same box, heading, pulsing lines and height", () => {
		renderWithMessages(<AiSummarySkeleton testId="panel-ai-skeleton" />);

		const box = screen.getByTestId("panel-ai-skeleton");
		expect(box).toHaveAttribute("aria-busy", "true");
		expect(box).toHaveClass("rounded-xl", "bg-pleiful-moonlight-5", "p-3.5");
		expect(screen.getByRole("heading", { name: "Key insights" })).toBeInTheDocument();
		expect(screen.getByTestId("key-insights-skeleton").parentElement).toHaveClass("h-44");
	});
});
