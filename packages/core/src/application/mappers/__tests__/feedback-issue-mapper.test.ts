import type { Feedback } from "@core/application/dtos/feedback-dto.types";
import {
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
	it("prefixes improvements and bugs differently", () => {
		expect(toFeedbackIssueTitle("improvement", "Add filters")).toBe("[MHM feedback] Add filters");
		expect(toFeedbackIssueTitle("bug", "Map is blank")).toBe("[MHM bug] Map is blank");
	});

	it("flattens whitespace and cuts long messages at 80 characters", () => {
		const long = `${"word ".repeat(30)}\nend`;
		const title = toFeedbackIssueTitle("improvement", long);

		expect(title).not.toContain("\n");
		expect(title.endsWith("...")).toBe(true);
		expect(title.length).toBeLessThanOrEqual("[MHM feedback] ".length + 80 + 3);
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
	it("builds the draft for the issue tracker", () => {
		expect(toFeedbackIssueDraft(FEEDBACK, [], AT)).toMatchObject({
			type: "bug",
			title: "[MHM bug] The side panel covers the zoom buttons. Steps: open any facility.",
			submitter: { displayName: "Stefano Sanchez" },
		});
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
