import type { Feedback } from "@core/application/dtos/feedback-dto.types";
import {
	normalizeFeedbackTitle,
	toFeedbackIssueDescription,
	toFeedbackIssueDraft,
	toFeedbackIssueSubmitter,
	toFeedbackIssueTitle,
} from "@core/application/mappers/feedback-issue-mapper";

const AT = new Date("2026-09-29T20:00:00.000Z");
const FEEDBACK: Feedback = {
	type: "bug",
	message: "The side panel covers the zoom buttons.\nSteps: open any facility.",
	pageUrl: "http://localhost:3000/",
	view: "facilities-map",
	images: [],
	submitter: { name: "Stefano Sanchez", email: "stefano@plei.com" },
};

describe("toFeedbackIssueTitle", () => {
	it("uses the generated title when there is one", () => {
		expect(toFeedbackIssueTitle("bug", "Map pins overlap at high zoom")).toBe(
			"Map pins overlap at high zoom",
		);
	});

	it("falls back to a generic title by type", () => {
		expect(toFeedbackIssueTitle("improvement")).toBe("Feedback");
		expect(toFeedbackIssueTitle("bug", null)).toBe("Bug Report");
		expect(toFeedbackIssueTitle("bug", "  ")).toBe("Bug Report");
	});
});

describe("normalizeFeedbackTitle", () => {
	it("strips labels, quotes, markdown and the trailing period", () => {
		expect(normalizeFeedbackTitle('Title: "Map pins overlap at high zoom."')).toBe(
			"Map pins overlap at high zoom",
		);
		expect(normalizeFeedbackTitle("**Add a market filter**")).toBe("Add a market filter");
		expect(normalizeFeedbackTitle("  side  panel\tcovers zoom buttons...  ")).toBe(
			"Side panel covers zoom buttons",
		);
	});

	it("keeps only the first non-empty line", () => {
		expect(normalizeFeedbackTitle("\nSearch misses facilities\nBecause the list is stale")).toBe(
			"Search misses facilities",
		);
	});

	it("rejects empty or overly long output", () => {
		expect(normalizeFeedbackTitle(undefined)).toBeNull();
		expect(normalizeFeedbackTitle('"".')).toBeNull();
		expect(
			normalizeFeedbackTitle("one two three four five six seven eight nine ten eleven"),
		).toBeNull();
		expect(normalizeFeedbackTitle("x".repeat(81))).toBeNull();
	});
});

describe("toFeedbackIssueDescription", () => {
	it("includes the message, submitter, page, view, timestamp and screenshots", () => {
		const description = toFeedbackIssueDescription(
			FEEDBACK,
			["https://a/1.png", "https://a/2.png"],
			AT,
		);

		expect(description).toContain(FEEDBACK.message);
		expect(description).toContain("**Submitted by:** Stefano Sanchez (stefano@plei.com)");
		expect(description).toContain("**Page:** http://localhost:3000/");
		expect(description).toContain("**View:** facilities-map");
		expect(description).toContain("**Submitted at:** 2026-09-29T20:00:00.000Z");
		expect(description).toContain("![](https://a/1.png)\n\n![](https://a/2.png)");
	});

	it("omits what was not provided", () => {
		const description = toFeedbackIssueDescription(
			{ ...FEEDBACK, pageUrl: undefined, view: undefined, submitter: { email: "a@plei.com" } },
			[],
			AT,
		);

		expect(description).toContain("**Submitted by:** a@plei.com");
		expect(description).not.toContain("**Page:**");
		expect(description).not.toContain("**View:**");
		expect(description).not.toContain("Screenshots");
	});
});

describe("toFeedbackIssueDraft", () => {
	it("builds the draft for the issue tracker with the generated title", () => {
		expect(toFeedbackIssueDraft(FEEDBACK, [], AT, "Side panel covers zoom buttons")).toMatchObject({
			type: "bug",
			title: "Side panel covers zoom buttons",
			submitter: { displayName: "Stefano Sanchez" },
		});
	});

	it("keeps the full message in the description when the title is generic", () => {
		const draft = toFeedbackIssueDraft(FEEDBACK, [], AT);

		expect(draft.title).toBe("Bug Report");
		expect(draft.description.startsWith(FEEDBACK.message)).toBe(true);
	});
});

describe("toFeedbackIssueSubmitter", () => {
	it("uses the name and avatar when the session has them", () => {
		expect(
			toFeedbackIssueSubmitter({
				...FEEDBACK,
				submitter: { ...FEEDBACK.submitter, avatarUrl: "https://img/s.png" },
			}),
		).toEqual({ displayName: "Stefano Sanchez", avatarUrl: "https://img/s.png" });
	});

	it("falls back to the email and leaves the avatar out", () => {
		expect(
			toFeedbackIssueSubmitter({
				...FEEDBACK,
				submitter: { name: null, email: "a@plei.com", avatarUrl: null },
			}),
		).toEqual({ displayName: "a@plei.com" });
	});
});
