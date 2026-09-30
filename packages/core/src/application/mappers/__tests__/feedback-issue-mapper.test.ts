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
	it("names the reporter after the type", () => {
		const submitter = { name: "Lucas Arena", email: "lucas@plei.com" };

		expect(toFeedbackIssueTitle("bug", submitter)).toBe("Bug Report from Lucas Arena");
		expect(toFeedbackIssueTitle("improvement", submitter)).toBe("Feedback from Lucas Arena");
	});

	it("uses the email when there is no name", () => {
		expect(toFeedbackIssueTitle("bug", { name: " ", email: "lucas@plei.com" })).toBe(
			"Bug Report from lucas@plei.com",
		);
		expect(toFeedbackIssueTitle("improvement", { name: null, email: "lucas@plei.com" })).toBe(
			"Feedback from lucas@plei.com",
		);
	});

	it("falls back to the plain title without a name or email", () => {
		expect(toFeedbackIssueTitle("bug")).toBe("Bug Report");
		expect(toFeedbackIssueTitle("improvement", { name: "", email: "" })).toBe("Feedback");
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
	it("builds the draft with the generic title and the full message", () => {
		const draft = toFeedbackIssueDraft(FEEDBACK, [], AT);

		expect(draft).toMatchObject({
			type: "bug",
			title: "Bug Report from Stefano Sanchez",
			submitter: { displayName: "Stefano Sanchez" },
		});
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
