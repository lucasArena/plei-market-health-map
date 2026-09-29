import { buildFacilitySummaryMessages } from "@/lib/ai/facility-summary-prompt";
import { FACILITY_DETAIL } from "@/test/facility-detail";

describe("buildFacilitySummaryMessages", () => {
	it("asks only about the games played in the last 28 days", () => {
		const messages = buildFacilitySummaryMessages(FACILITY_DETAIL, "en");
		const [system, example, answer] = messages;

		expect(system?.content).toContain("last 28 days");
		expect(system?.content).toContain("in English");
		expect([example?.role, answer?.role]).toEqual(["user", "assistant"]);
		expect(messages.at(-1)?.content).toBe(
			[
				"Facts:",
				"Facility: Pegaso HTX.",
				"Pickup games played in the last 28 days (Aug 31 to Sep 27, 2026): 212.",
				"",
				"Write the summary in English.",
			].join("\n"),
		);
	});

	it("answers in the viewer's language", () => {
		const portuguese = buildFacilitySummaryMessages(FACILITY_DETAIL, "pt-BR");
		expect(portuguese.at(-1)?.content).toContain("Write the summary in Brazilian Portuguese.");
		expect(portuguese[2]?.content).toContain("últimos 28 dias");

		const french = buildFacilitySummaryMessages(FACILITY_DETAIL, "fr");
		expect(french[0]?.content).toContain("in English");
		expect(french[2]?.content).toContain("last 28 days");
	});
});
