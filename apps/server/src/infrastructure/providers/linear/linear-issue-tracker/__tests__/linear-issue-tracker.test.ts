import { IssueTrackerError } from "@market-health-map/core/application";
import { LinearApiKeyAuth } from "@server/infrastructure/providers/linear/linear-auth/linear-auth";
import type { LinearAuth } from "@server/infrastructure/providers/linear/linear-auth/linear-auth.types";
import {
	LINEAR_GRAPHQL_URL,
	LinearIssueTracker,
} from "@server/infrastructure/providers/linear/linear-issue-tracker/linear-issue-tracker";

const PNG = new Uint8Array([137, 80, 78, 71]);
const UPLOAD_URL = "https://storage.googleapis.com/linear-uploads/abc?signature=1";
const ASSET_URL = "https://uploads.linear.app/org/abc/shot.png";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const fileUploadOk = () =>
	json({
		data: {
			fileUpload: {
				success: true,
				uploadFile: {
					uploadUrl: UPLOAD_URL,
					assetUrl: ASSET_URL,
					headers: [
						{ key: "x-goog-content-length-range", value: "4,4" },
						{ key: "Content-Disposition", value: 'attachment; filename="shot.png"' },
					],
				},
			},
		},
	});
const issueCreateOk = () =>
	json({
		data: {
			issueCreate: {
				success: true,
				issue: { identifier: "ENG-42", url: "https://linear.app/plei/issue/ENG-42" },
			},
		},
	});
const customerNeedCreateOk = () =>
	json({
		data: {
			customerNeedCreate: {
				success: true,
			},
		},
	});

function appAuth(): LinearAuth & { invalidate: ReturnType<typeof vi.fn> } {
	let token = 1;
	return {
		mode: "app",
		authorization: vi.fn(async () => `Bearer app_token_${token}`),
		invalidate: vi.fn(() => {
			token += 1;
		}),
	};
}

function setup(...responses: Array<Response | Error>) {
	return setupWith(new LinearApiKeyAuth("lin_api_test"), ...responses);
}

function setupWith(auth: LinearAuth, ...responses: Array<Response | Error>) {
	const fetch = vi.fn(async (_url: string, _init: RequestInit) => {
		const next = responses.shift();
		if (next instanceof Error) throw next;
		return next ?? new Response(null, { status: 500 });
	});
	const tracker = new LinearIssueTracker({ auth, fetch });
	const graphqlBody = (call: number) =>
		JSON.parse(fetch.mock.calls[call]?.[1].body as string) as {
			query: string;
			variables: Record<string, unknown>;
		};
	return { tracker, fetch, graphqlBody };
}

const ATTACHMENT = { filename: "shot.png", contentType: "image/png", bytes: PNG };
const DRAFT = {
	type: "improvement" as const,
	title: "[MHM feedback] Add filters",
	requestBody: "Body",
	submitter: { displayName: "Stefano Sanchez", avatarUrl: "https://img/s.png" },
};
const BUG_DRAFT = {
	...DRAFT,
	type: "bug" as const,
	title: "[MHM bug] Map blank",
};

describe("LinearIssueTracker", () => {
	it("requests an upload url, PUTs the bytes with the signed headers and returns the asset url", async () => {
		const { tracker, fetch, graphqlBody } = setup(
			fileUploadOk(),
			new Response(null, { status: 200 }),
		);

		await expect(tracker.uploadAttachment(ATTACHMENT)).resolves.toBe(ASSET_URL);

		expect(fetch.mock.calls[0]?.[0]).toBe(LINEAR_GRAPHQL_URL);
		expect(fetch.mock.calls[0]?.[1]).toMatchObject({
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: "lin_api_test" },
		});
		expect(graphqlBody(0).query).toContain("fileUpload(");
		expect(graphqlBody(0).variables).toEqual({
			contentType: "image/png",
			filename: "shot.png",
			size: 4,
		});

		const [putUrl, putInit] = fetch.mock.calls[1] ?? [];
		expect(putUrl).toBe(UPLOAD_URL);
		expect(putInit?.method).toBe("PUT");
		const headers = putInit?.headers as Headers;
		expect(headers.get("content-type")).toBe("image/png");
		expect(headers.get("cache-control")).toBe("public, max-age=31536000");
		expect(headers.get("x-goog-content-length-range")).toBe("4,4");
		expect(headers.get("content-disposition")).toBe('attachment; filename="shot.png"');
		const body = putInit?.body as Blob;
		expect(new Uint8Array(await body.arrayBuffer())).toEqual(PNG);
	});

	it("creates an improvement issue and its customer request", async () => {
		const { tracker, graphqlBody } = setup(issueCreateOk(), customerNeedCreateOk());

		await expect(tracker.createIssue(DRAFT)).resolves.toEqual({
			identifier: "ENG-42",
			url: "https://linear.app/plei/issue/ENG-42",
		});

		expect(graphqlBody(0).query).toContain("issueCreate(");
		expect(graphqlBody(0).variables).toEqual({
			input: {
				teamId: "635f83c3-3276-4ae6-aa29-5b633dc8dc38",
				stateId: "973949af-0a76-4de3-a870-de074888bc75",
				projectId: "98a63408-5cac-4a0e-85a9-1b73d17ea096",
				labelIds: [],
				title: "[MHM feedback] Add filters",
			},
		});
		expect(graphqlBody(1).query).toContain("customerNeedCreate(");
		expect(graphqlBody(1).variables).toEqual({
			input: {
				issueId: "ENG-42",
				body: "Body",
			},
		});
	});

	it("creates a bug issue without a customer request", async () => {
		const { tracker, fetch, graphqlBody } = setup(issueCreateOk());

		await expect(tracker.createIssue(BUG_DRAFT)).resolves.toMatchObject({
			identifier: "ENG-42",
		});

		expect(graphqlBody(0).variables).toMatchObject({
			input: {
				teamId: "bd06d3df-8b17-42f7-96b1-0b6b7b3eb5ad",
				labelIds: ["66be57d9-22f0-4fba-a55a-9e0782dd3c0d"],
				description: "Body",
			},
		});
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("files the issue as the app on behalf of the submitter with a Bearer token", async () => {
		const { tracker, fetch, graphqlBody } = setupWith(
			appAuth(),
			issueCreateOk(),
			customerNeedCreateOk(),
		);

		await tracker.createIssue(DRAFT);

		expect(fetch.mock.calls[0]?.[1]).toMatchObject({
			headers: { Authorization: "Bearer app_token_1" },
		});
		expect(graphqlBody(0).variables).toMatchObject({
			input: { createAsUser: "Stefano Sanchez", displayIconUrl: "https://img/s.png" },
		});
		expect(graphqlBody(1).variables).toMatchObject({
			input: { createAsUser: "Stefano Sanchez", displayIconUrl: "https://img/s.png" },
		});
	});

	it("uploads screenshots with the app token too", async () => {
		const { tracker, fetch } = setupWith(
			appAuth(),
			fileUploadOk(),
			new Response(null, { status: 200 }),
		);

		await tracker.uploadAttachment(ATTACHMENT);

		expect(fetch.mock.calls[0]?.[1]).toMatchObject({
			headers: { Authorization: "Bearer app_token_1" },
		});
	});

	it("refreshes the app token once on a 401 and retries", async () => {
		const auth = appAuth();
		const { tracker, fetch } = setupWith(
			auth,
			json({ errors: [{ message: "Authentication required" }] }, 401),
			issueCreateOk(),
			customerNeedCreateOk(),
		);

		await expect(tracker.createIssue(DRAFT)).resolves.toMatchObject({ identifier: "ENG-42" });

		expect(auth.invalidate).toHaveBeenCalledTimes(1);
		expect(fetch.mock.calls[1]?.[1]).toMatchObject({
			headers: { Authorization: "Bearer app_token_2" },
		});
	});

	it("gives up when the refreshed app token is also rejected", async () => {
		const unauthorized = () => json({ errors: [{ message: "Authentication required" }] }, 401);
		const { tracker, fetch } = setupWith(appAuth(), unauthorized(), unauthorized());

		await expect(tracker.createIssue(DRAFT)).rejects.toThrow(/Authentication required/);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("does not retry or send the app-only fields with a personal key", async () => {
		const { tracker, fetch, graphqlBody } = setup(
			json({ errors: [{ message: "Authentication required" }] }, 401),
		);

		await expect(tracker.createIssue(DRAFT)).rejects.toThrow(/Authentication required/);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(graphqlBody(0).variables.input).not.toHaveProperty("createAsUser");
		expect(graphqlBody(0).variables.input).not.toHaveProperty("displayIconUrl");
	});

	it.each([
		[
			"GraphQL errors",
			() => json({ errors: [{ message: "Authentication required" }] }, 401),
			/Authentication required/,
		],
		["a non-2xx status", () => new Response("nope", { status: 500 }), /status 500/],
		["an unexpected payload", () => json({ data: { fileUpload: { nope: true } } }), /unexpected/],
		[
			"an unsuccessful upload request",
			() => json({ data: { fileUpload: { success: false, uploadFile: null } } }),
			/upload URL/,
		],
	])("fails the upload on %s", async (_label, response, message) => {
		const { tracker } = setup(response());

		await expect(tracker.uploadAttachment(ATTACHMENT)).rejects.toThrow(message);
	});

	it("fails when the signed PUT is rejected", async () => {
		const { tracker } = setup(fileUploadOk(), new Response(null, { status: 403 }));

		await expect(tracker.uploadAttachment(ATTACHMENT)).rejects.toThrow(/status 403/);
	});

	it("fails when Linear does not create the issue", async () => {
		const { tracker } = setup(json({ data: { issueCreate: { success: false, issue: null } } }));

		await expect(tracker.createIssue(DRAFT)).rejects.toThrow(/did not create/);
	});

	it("fails when Linear does not create the customer request", async () => {
		const { tracker } = setup(
			issueCreateOk(),
			json({ data: { customerNeedCreate: { success: false } } }),
		);

		await expect(tracker.createIssue(DRAFT)).rejects.toThrow(/customer request/);
	});

	it("wraps network failures with the cause", async () => {
		const cause = new TypeError("fetch failed");
		const { tracker } = setup(cause);

		const error = await tracker.createIssue(DRAFT).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(IssueTrackerError);
		expect(error).toMatchObject({ message: "Could not reach Linear.", cause });
	});

	it("uses the global fetch by default", async () => {
		const spy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(issueCreateOk())
			.mockResolvedValueOnce(customerNeedCreateOk());

		await new LinearIssueTracker({ auth: new LinearApiKeyAuth("k") }).createIssue(DRAFT);

		expect(spy).toHaveBeenCalledWith(
			LINEAR_GRAPHQL_URL,
			expect.objectContaining({ method: "POST" }),
		);
		spy.mockRestore();
	});
});
