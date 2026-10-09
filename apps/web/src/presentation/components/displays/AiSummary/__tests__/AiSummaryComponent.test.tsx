import { fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { AiSummary } from "@/presentation/components/displays/AiSummary/AiSummaryComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/displays/AiSummary/AiSummaryComponent.rules", () => ({
	useAiSummaryRules: () => mockRules(),
}));

const messages = EN_MESSAGES.facilityAi;

function rulesWith(status: string, overrides: object = {}) {
	return {
		contentRef: { current: null },
		handleGenerate: vi.fn(),
		isExpanded: false,
		isOverflowing: false,
		toggleExpanded: vi.fn(),
		messages,
		progressLabel: "Loading the AI model on this device… 40%",
		progressPercent: 40,
		status,
		text: "Summary text.",
		...overrides,
	};
}

function renderSummary() {
	render(<AiSummary context={{ cacheKey: "k", prompt: [] }} fallback="Summary text." />);
}

describe("AiSummary", () => {
	it("offers the one-time download over a skeleton, without template text", () => {
		const rules = rulesWith("idle", { text: null });
		mockRules.mockReturnValue(rules);
		renderSummary();

		fireEvent.click(screen.getByRole("button", { name: `✨ ${messages.generate}` }));

		expect(screen.queryByText("Summary text.")).not.toBeInTheDocument();
		expect(screen.getByTestId("key-insights-skeleton")).toBeInTheDocument();
		expect(screen.getByText(messages.downloadHint)).toBeInTheDocument();
		expect(rules.handleGenerate).toHaveBeenCalled();
	});

	it("shows the download progress", () => {
		mockRules.mockReturnValue(rulesWith("loading"));
		renderSummary();

		expect(screen.getByRole("status")).toHaveTextContent("40%");
		expect(screen.getByTestId("ai-summary-progress")).toHaveStyle({ width: "40%" });
	});

	it.each([
		["generating", messages.writing],
		["ready", messages.label],
		["error", messages.failed],
	])("labels the %s state", (status, label) => {
		mockRules.mockReturnValue(rulesWith(status));
		renderSummary();

		expect(screen.getByText(label)).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("shows only the text when unsupported", () => {
		mockRules.mockReturnValue(rulesWith("unsupported"));
		renderSummary();

		expect(screen.getByText("Summary text.")).toBeInTheDocument();
		expect(screen.getByText(messages.label)).toBeInTheDocument();
	});

	it("uses the status title and tone colors when given", () => {
		mockRules.mockReturnValue(rulesWith("ready"));
		render(
			<AiSummary
				context={{ cacheKey: "k", prompt: [] }}
				fallback="Summary text."
				title="Needs attention · Key insights"
				tone="attention"
			/>,
		);

		const title = screen.getByRole("heading", { name: "Needs attention · Key insights" });
		expect(title).toHaveClass("text-[#b91c1c]");
		expect(title.closest("[aria-busy]")).toHaveClass("bg-[#fef2f2]", "border-[#fecaca]");
	});

	it("marks a finished AI summary with the sparkle icon", () => {
		mockRules.mockReturnValue(rulesWith("ready"));
		renderSummary();

		expect(screen.getByText("Key insights")).toBeInTheDocument();
		expect(screen.getByTestId("ai-summary-icon")).toBeInTheDocument();
	});

	it("keeps a fixed height and offers Show more only when the text overflows", () => {
		const rules = rulesWith("ready", { isOverflowing: true });
		mockRules.mockReturnValue(rules);
		const { rerender } = render(
			<AiSummary context={{ cacheKey: "k", prompt: [] }} fallback="Summary text." />,
		);

		expect(screen.getByTestId("ai-summary-content")).toHaveClass("h-44", "overflow-hidden");
		const toggle = screen.getByRole("button", { name: messages.showMore });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(toggle).toHaveClass("rounded-full", "bg-white/90");
		expect(screen.getByTestId("ai-summary-toggle-row")).toHaveClass("justify-center", "-mt-6");
		fireEvent.click(toggle);
		expect(rules.toggleExpanded).toHaveBeenCalled();

		mockRules.mockReturnValue(rulesWith("ready", { isOverflowing: true, isExpanded: true }));
		rerender(<AiSummary context={{ cacheKey: "k", prompt: [] }} fallback="Summary text." />);
		expect(screen.getByTestId("ai-summary-content")).not.toHaveClass("h-44");
		expect(screen.getByRole("button", { name: messages.showLess })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
	});

	it("sits flat with a masked fade and a green Show more in the insight panel", () => {
		mockRules.mockReturnValue(rulesWith("ready", { isOverflowing: true }));
		render(<AiSummary context={{ cacheKey: "k", prompt: [] }} fallback="Summary text." isFlat />);

		expect(screen.getByTestId("ai-summary-content")).toHaveClass(
			"[mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]",
		);
		expect(screen.getByRole("button", { name: messages.showMore })).toHaveClass(
			"text-pleiful-pitch-green-50",
		);
	});
});
