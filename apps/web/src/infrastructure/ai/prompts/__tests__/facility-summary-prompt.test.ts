import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { FacilitySummaryPrompt } from "@/infrastructure/ai/prompts/facility-summary-prompt";

const prompt = new FacilitySummaryPrompt();

describe("FacilitySummaryPrompt", () => {
	it("includes the high-level facility activity signals", () => {
		const messages = prompt.build(
			{
				...FACILITY_DETAIL,
				stats: {
					...FACILITY_DETAIL.stats,
					popularTimes: [
						...FACILITY_DETAIL.stats.popularTimes,
						{ dayOfWeek: 1, timePeriod: 0, gamesPlayed: 1 },
					],
				},
			},
			"en",
		);
		const [system, example, answer] = messages;

		expect(system?.content).toContain("last 28 days");
		expect(system?.content).toContain("in English");
		expect([example?.role, answer?.role]).toEqual(["user", "assistant"]);
		expect(messages.at(-1)?.content).toBe(
			[
				"Facts:",
				"Facility: Pegaso HTX.",
				"Pickup games played in the last 28 days (Aug 31 to Sep 27, 2026): 212.",
				"Confirmation rate: 84.8%.",
				"Unique players: 126.",
				"Activated players: 24.",
				"Change versus the previous 28 days: 6%.",
				"Busiest time: Saturday evenings.",
				"",
				"Write the summary in English.",
			].join("\n"),
		);
	});

	it("marks unavailable rates and falls back to the first time period", () => {
		const detail = {
			...FACILITY_DETAIL,
			stats: {
				...FACILITY_DETAIL.stats,
				confirmationRate: null,
				playedPeriodChangePercent: null,
				popularTimes: [],
			},
		};
		const content = prompt.build(detail, "en").at(-1)?.content;
		expect(content).toContain("Confirmation rate: unavailable.");
		expect(content).toContain("Change versus the previous 28 days: unavailable.");
		expect(content).toContain("Busiest time: Monday mornings.");
	});

	it("answers in the viewer's language", () => {
		const portuguese = prompt.build(FACILITY_DETAIL, "pt-BR");
		expect(portuguese.at(-1)?.content).toContain("Write the summary in Brazilian Portuguese.");
		expect(portuguese[2]?.content).toContain("taxa de confirmação");

		const french = prompt.build(FACILITY_DETAIL, "fr");
		expect(french[0]?.content).toContain("in English");
		expect(french[2]?.content).toContain("confirmation rate");
	});
});
