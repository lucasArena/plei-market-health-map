import { render, screen } from "@testing-library/react";
import { KeyInsights } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent";

describe("KeyInsights", () => {
	it("keeps the overall change outside contributor bullets at a readable size", () => {
		render(
			<KeyInsights
				title="Key insights"
				text={
					"Overall games declined.\n\n- Houston: 200 → 100 games.\n- Philadelphia: 100 → 150 games."
				}
				introFirst
			/>,
		);
		expect(screen.getByText("Overall games declined.").tagName).toBe("P");
		expect(screen.getByText("Overall games declined.")).toHaveClass("text-sm");
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
		expect(screen.getByRole("list")).toHaveClass("text-sm");
		expect(screen.getByTestId("key-insights-ai-icon")).toHaveAttribute("aria-hidden", "true");
	});
	it("renders a single plain fallback as a paragraph", () => {
		render(<KeyInsights title="Key insights" text="No clear directional signal." />);
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
		expect(screen.getByText("No clear directional signal.")).toHaveClass("text-sm");
	});
	it("renders a single model bullet and removes repeated insights", () => {
		render(<KeyInsights title="Key insights" text={"- Games declined.\n- Games declined."} />);
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		expect(screen.getByRole("listitem")).toHaveTextContent("Games declined.");
	});
	it("keeps a single opening paragraph and handles an empty streaming result", () => {
		const { rerender } = render(
			<KeyInsights title="Key insights" text="Games declined." introFirst />,
		);
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
		expect(screen.getByText("Games declined.").tagName).toBe("P");
		rerender(<KeyInsights title="Key insights" text="" />);
		expect(screen.getByRole("heading", { name: "Key insights" })).toBeInTheDocument();
	});

	it("shows a skeleton instead of text while loading", () => {
		render(<KeyInsights title="Key insights" text="" isLoading />);

		expect(screen.getByRole("heading", { name: "Key insights" })).toBeInTheDocument();
		expect(screen.getByTestId("key-insights-skeleton")).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
		expect(document.querySelector("p")).toBeNull();
	});
});
