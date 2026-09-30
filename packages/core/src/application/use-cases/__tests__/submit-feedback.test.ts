import {
	MAX_FEEDBACK_IMAGE_BYTES,
	MAX_FEEDBACK_MESSAGE_LENGTH,
	MAX_FEEDBACK_REQUEST_BYTES,
} from "@core/application/dtos/feedback-dto";
import type { SubmitFeedbackInput } from "@core/application/dtos/feedback-dto.types";
import { FeedbackNotConfiguredError } from "@core/application/errors/feedback-not-configured-error";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { PayloadTooLargeError } from "@core/application/errors/payload-too-large-error";
import { FixedClock } from "@core/application/testing/fakes";
import { InMemoryIssueTracker } from "@core/application/testing/in-memory-issue-tracker";
import { makeSubmitFeedback } from "@core/application/use-cases/submit-feedback";

const NOW = new Date("2026-09-29T20:00:00.000Z");
const PNG = new Uint8Array([137, 80, 78, 71]);
const INPUT: SubmitFeedbackInput = {
	type: "improvement",
	message: "  Show the market name on hover  ",
	pageUrl: "http://localhost:3000/?market=nyc",
	view: "facilities-map",
	submitter: { name: "Stefano Sanchez", email: "stefano@plei.com" },
};

function setup() {
	const issues = new InMemoryIssueTracker();
	const submitFeedback = makeSubmitFeedback({ issues, clock: new FixedClock(NOW) });
	return { issues, submitFeedback };
}

async function rejection(input: SubmitFeedbackInput) {
	const { submitFeedback, issues } = setup();
	const error = await submitFeedback(input).catch((caught: unknown) => caught);
	expect(issues.issues).toHaveLength(0);
	return error as InvalidRequestError;
}

describe("submitFeedback", () => {
	it("creates an improvement issue and returns its identifier and url", async () => {
		const { issues, submitFeedback } = setup();

		const view = await submitFeedback(INPUT);

		expect(view).toEqual({ identifier: "TEST-1", url: "https://linear.test/issue/TEST-1" });
		expect(issues.issues).toHaveLength(1);
		expect(issues.issues[0]?.type).toBe("improvement");
		expect(issues.issues[0]?.title).toBe("Feedback from Stefano Sanchez");
		expect(issues.issues[0]?.description).toContain("2026-09-29T20:00:00.000Z");
		expect(issues.attachments).toHaveLength(0);
	});

	it("passes the submitter's name and avatar for the issue creator", async () => {
		const { issues, submitFeedback } = setup();

		await submitFeedback({
			...INPUT,
			submitter: { ...INPUT.submitter, avatarUrl: "https://img/s.png" },
		});

		expect(issues.issues[0]?.submitter).toEqual({
			displayName: "Stefano Sanchez",
			avatarUrl: "https://img/s.png",
		});
	});

	it("drops an unusable avatar instead of rejecting the feedback", async () => {
		const { issues, submitFeedback } = setup();

		await submitFeedback({
			...INPUT,
			submitter: { name: " ", email: "stefano@plei.com", avatarUrl: "javascript:alert(1)" },
		});

		expect(issues.issues[0]?.submitter).toEqual({ displayName: "stefano@plei.com" });
	});

	it("routes bugs as bugs", async () => {
		const { issues, submitFeedback } = setup();

		await submitFeedback({ ...INPUT, type: "bug", message: "Map goes blank" });

		expect(issues.issues[0]).toMatchObject({
			type: "bug",
			title: "Bug Report from Stefano Sanchez",
		});
	});

	it("uploads every screenshot in order before creating the issue", async () => {
		const { issues, submitFeedback } = setup();

		await submitFeedback({
			...INPUT,
			images: [
				{ filename: "one.png", contentType: "image/png", bytes: PNG },
				{ filename: "", contentType: "image/webp", bytes: PNG },
			],
		});

		expect(issues.attachments.map((file) => file.filename)).toEqual(["one.png", "screenshot"]);
		const description = issues.issues[0]?.description ?? "";
		expect(description).toContain("![](https://uploads.test/1/one.png)");
		expect(description).toContain("![](https://uploads.test/2/screenshot)");
	});

	it("treats blank page, view and name as missing", async () => {
		const { issues, submitFeedback } = setup();

		await submitFeedback({
			...INPUT,
			pageUrl: "  ",
			view: "",
			submitter: { name: null, email: "stefano@plei.com" },
		});

		const description = issues.issues[0]?.description ?? "";
		expect(description).not.toContain("**Page:**");
		expect(description).toContain("**Submitted by:** stefano@plei.com");
	});

	it("refuses screenshots that add up to more than the request limit", async () => {
		const { issues, submitFeedback } = setup();
		const bytes = new Uint8Array(MAX_FEEDBACK_REQUEST_BYTES / 2 + 1);
		const image = { filename: "big.png", contentType: "image/png", bytes };

		await expect(submitFeedback({ ...INPUT, images: [image, image] })).rejects.toBeInstanceOf(
			PayloadTooLargeError,
		);
		expect(issues.attachments).toHaveLength(0);
	});

	it("refuses with a not-configured error when there is no issue tracker", async () => {
		const submitFeedback = makeSubmitFeedback({ issues: null, clock: new FixedClock(NOW) });

		await expect(submitFeedback(INPUT)).rejects.toBeInstanceOf(FeedbackNotConfiguredError);
	});

	it.each([
		["an unknown type", { ...INPUT, type: "question" }, "type"],
		["a blank message", { ...INPUT, message: "   " }, "message"],
		[
			"a message that is too long",
			{ ...INPUT, message: "a".repeat(MAX_FEEDBACK_MESSAGE_LENGTH + 1) },
			"message",
		],
		["a page url that is too long", { ...INPUT, pageUrl: "a".repeat(2049) }, "pageUrl"],
		["an invalid submitter email", { ...INPUT, submitter: { email: "nope" } }, "submitter"],
		[
			"more than five images",
			{
				...INPUT,
				images: Array.from({ length: 6 }, () => ({
					filename: "a.png",
					contentType: "image/png",
					bytes: PNG,
				})),
			},
			"images",
		],
		[
			"an unsupported image type",
			{ ...INPUT, images: [{ filename: "a.svg", contentType: "image/svg+xml", bytes: PNG }] },
			"images",
		],
		[
			"an empty image",
			{
				...INPUT,
				images: [{ filename: "a.png", contentType: "image/png", bytes: new Uint8Array() }],
			},
			"images",
		],
		[
			"an image over 10 MB",
			{
				...INPUT,
				images: [
					{
						filename: "a.png",
						contentType: "image/png",
						bytes: new Uint8Array(MAX_FEEDBACK_IMAGE_BYTES + 1),
					},
				],
			},
			"images",
		],
	])("rejects %s", async (_label, input, field) => {
		const error = await rejection(input);

		expect(error).toBeInstanceOf(InvalidRequestError);
		expect(error.details).toEqual(
			expect.arrayContaining([expect.objectContaining({ path: expect.arrayContaining([field]) })]),
		);
	});
});
