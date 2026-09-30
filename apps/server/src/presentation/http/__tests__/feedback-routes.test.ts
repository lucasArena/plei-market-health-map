import type { IssueTracker } from "@market-health-map/core/application";
import {
	MAX_FEEDBACK_REQUEST_BYTES,
	makeSubmitFeedback,
} from "@market-health-map/core/application";
import { FixedClock, InMemoryIssueTracker } from "@market-health-map/core/application/testing";
import { DryRunIssueTracker } from "@server/infrastructure/linear/dry-run-issue-tracker";
import { createApiApp } from "@server/presentation/http/api-app";
import type { ApiServices } from "@server/presentation/http/api-app.types";
import type { AccessDecision } from "@server/presentation/http/authenticate.types";
import type { ApiTestBody } from "@server/testing/api-response.types";
import { EN_MESSAGES } from "@server/testing/messages";

const NOW = new Date("2026-09-29T20:00:00.000Z");
const ALLOWED: AccessDecision = {
	status: "allowed",
	userId: "g-1",
	email: "stefano@plei.com",
	name: "Stefano Sanchez",
	image: "https://lh3.googleusercontent.com/a/stefano",
};
const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function setup(issues: IssueTracker | null, access: AccessDecision = ALLOWED) {
	const submitFeedback = vi.fn(makeSubmitFeedback({ issues, clock: new FixedClock(NOW) }));
	const services = { submitFeedback } as unknown as ApiServices;
	const app = createApiApp({
		resolveAccess: vi.fn().mockResolvedValue(access),
		services: () => services,
	});
	const post = async (
		body: FormData | string | ArrayBuffer | undefined,
		headers: Record<string, string> = {},
	) => {
		const response = await app.request("http://localhost/api/v1/feedback", {
			method: "POST",
			body,
			headers,
		});
		return { status: response.status, body: (await response.json()) as ApiTestBody };
	};
	return { post, submitFeedback };
}

function form(fields: Record<string, string>, images: File[] = []) {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.append(key, value);
	for (const image of images) data.append("images", image);
	return data;
}

const png = (name = "shot.png") => new File([PNG_BYTES], name, { type: "image/png" });

describe("POST /api/v1/feedback", () => {
	it("creates the issue and answers 201 with its identifier and url", async () => {
		const issues = new InMemoryIssueTracker();
		const { post } = setup(issues);

		const { status, body } = await post(
			form(
				{
					type: "bug",
					message: "Zoom buttons hide behind the panel",
					pageUrl: "http://localhost:3000/",
					view: "facilities-map",
				},
				[png("one.png"), png("two.png")],
			),
		);

		expect(status).toBe(201);
		expect(body.data).toEqual({ identifier: "TEST-1", url: "https://linear.test/issue/TEST-1" });
		expect(issues.attachments.map((file) => file.filename)).toEqual(["one.png", "two.png"]);
		expect(issues.attachments[0]?.bytes).toEqual(PNG_BYTES);
		const draft = issues.issues[0];
		expect(draft?.type).toBe("bug");
		expect(draft?.title).toBe("[MHM bug] Zoom buttons hide behind the panel");
		expect(draft?.description).toContain("Stefano Sanchez (stefano@plei.com)");
		expect(draft?.description).toContain("![](https://uploads.test/2/two.png)");
		expect(draft?.submitter).toEqual({
			displayName: "Stefano Sanchez",
			avatarUrl: "https://lh3.googleusercontent.com/a/stefano",
		});
	});

	it("answers 400 when the type or message is missing", async () => {
		const { post } = setup(new InMemoryIssueTracker());

		const { status, body } = await post(form({ message: "   " }));

		expect(status).toBe(400);
		expect(body.error.code).toBe("VALIDATION_ERROR");
		expect(body.error.message).toBe(EN_MESSAGES.errors.invalidRequest);
		const paths = (body.error.details ?? []).map((issue) => (issue as { path: unknown[] }).path[0]);
		expect(paths).toEqual(expect.arrayContaining(["type", "message"]));
		expect((await post(form({ type: "bug" }))).status).toBe(400);
	});

	it("answers 400 for a non-file image or unsupported image type", async () => {
		const { post } = setup(new InMemoryIssueTracker());
		const withText = form({ type: "bug", message: "x", images: "not-a-file" });
		const withSvg = form({ type: "bug", message: "x" }, [
			new File(["<svg/>"], "a.svg", { type: "image/svg+xml" }),
		]);

		expect((await post(withText)).status).toBe(400);
		expect((await post(withSvg)).status).toBe(400);
	});

	it("answers 400 when the body is not multipart", async () => {
		const { post, submitFeedback } = setup(new InMemoryIssueTracker());

		const { status, body } = await post(JSON.stringify({ type: "bug" }), {
			"content-type": "application/json",
		});

		expect(status).toBe(400);
		expect(body.error.code).toBe("VALIDATION_ERROR");
		expect(submitFeedback).not.toHaveBeenCalled();
	});

	it("answers 503 with a clear message when Linear is not configured", async () => {
		const { post } = setup(null);

		const { status, body } = await post(form({ type: "improvement", message: "Add filters" }));

		expect(status).toBe(503);
		expect(body.error).toEqual({
			code: "FEEDBACK_NOT_CONFIGURED",
			message: EN_MESSAGES.errors.feedbackNotConfigured,
		});
	});

	it("answers a fake 201 in dry-run mode without calling Linear", async () => {
		const log = vi.fn();
		const { post } = setup(new DryRunIssueTracker({ log }));

		const { status, body } = await post(
			form({ type: "improvement", message: "Add filters" }, [png()]),
		);

		expect(status).toBe(201);
		expect(body.data).toEqual({
			identifier: "DRY-1",
			url: "https://linear.app/dry-run/issue/DRY-1",
		});
		expect(log).toHaveBeenCalledWith("[feedback:dry-run] would create issue", expect.any(String));
	});

	it("requires a session like every other route", async () => {
		const { post, submitFeedback } = setup(new InMemoryIssueTracker(), { status: "anonymous" });

		expect((await post(form({ type: "bug", message: "x" }))).status).toBe(401);
		expect(submitFeedback).not.toHaveBeenCalled();
	});

	it("forbids accounts outside the Plei domain", async () => {
		const { post } = setup(new InMemoryIssueTracker(), { status: "denied", email: "a@gmail.com" });

		expect((await post(form({ type: "bug", message: "x" }))).status).toBe(403);
	});

	describe("total request size", () => {
		const over = () =>
			form({ type: "bug", message: "Too big" }, [
				new File([new Uint8Array(MAX_FEEDBACK_REQUEST_BYTES / 2)], "a.png", { type: "image/png" }),
				new File([new Uint8Array(MAX_FEEDBACK_REQUEST_BYTES / 2)], "b.png", { type: "image/png" }),
			]);

		it("answers 413 from Content-Length before reading the body", async () => {
			const { post, submitFeedback } = setup(new InMemoryIssueTracker());

			const { status, body } = await post(form({ type: "bug", message: "x" }), {
				"content-length": String(MAX_FEEDBACK_REQUEST_BYTES + 1),
			});

			expect(status).toBe(413);
			expect(body.error).toEqual({
				code: "PAYLOAD_TOO_LARGE",
				message: EN_MESSAGES.errors.payloadTooLarge,
			});
			expect(submitFeedback).not.toHaveBeenCalled();
		});

		it("answers 413 from the bytes actually read when the header is missing", async () => {
			const { post, submitFeedback } = setup(new InMemoryIssueTracker());

			const { status, body } = await post(over());

			expect(status).toBe(413);
			expect(body.error.code).toBe("PAYLOAD_TOO_LARGE");
			expect(submitFeedback).not.toHaveBeenCalled();
		});

		it("answers 413 when the Content-Length header understates the body", async () => {
			const { post, submitFeedback } = setup(new InMemoryIssueTracker());
			const request = new Request("http://localhost", { method: "POST", body: over() });

			const { status } = await post(await request.arrayBuffer(), {
				"content-type": request.headers.get("content-type") ?? "",
				"content-length": "100",
			});

			expect(status).toBe(413);
			expect(submitFeedback).not.toHaveBeenCalled();
		});

		it("accepts a request just under the limit", async () => {
			const issues = new InMemoryIssueTracker();
			const { post } = setup(issues);
			const image = new File([new Uint8Array(MAX_FEEDBACK_REQUEST_BYTES - 64 * 1024)], "big.png", {
				type: "image/png",
			});

			const { status } = await post(form({ type: "bug", message: "Almost too big" }, [image]));

			expect(status).toBe(201);
			expect(issues.attachments[0]?.bytes.byteLength).toBe(MAX_FEEDBACK_REQUEST_BYTES - 64 * 1024);
		});

		it("answers 400 when there is no body at all", async () => {
			const { post } = setup(new InMemoryIssueTracker());

			expect((await post(undefined)).status).toBe(400);
		});
	});
});
