import {
	type FeedbackIssueDraft,
	type FeedbackIssueView,
	type IssueAttachment,
	type IssueTracker,
	IssueTrackerError,
} from "@market-health-map/core/application";
import type { LinearAuth } from "@server/infrastructure/providers/linear/linear-auth/linear-auth.types";
import {
	DEFAULT_LINEAR_FEEDBACK_CONFIG,
	toLinearCustomerNeedInput,
	toLinearIssueInput,
} from "@server/infrastructure/providers/linear/linear-feedback-config/linear-feedback-config";
import type { LinearFeedbackConfig } from "@server/infrastructure/providers/linear/linear-feedback-config/linear-feedback-config.types";
import type {
	FetchLike,
	LinearIssueTrackerOptions,
} from "@server/infrastructure/providers/linear/linear-issue-tracker/linear-issue-tracker.types";
import {
	customerNeedCreateResponseSchema,
	fileUploadResponseSchema,
	issueCreateResponseSchema,
	linearErrorsSchema,
} from "@server/infrastructure/providers/linear/linear-responses/linear-responses";
import type { z } from "zod";

export const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";
export const LINEAR_UPLOAD_CACHE_CONTROL = "public, max-age=31536000";
const DEFAULT_TIMEOUT_MS = 20_000;

const FILE_UPLOAD_MUTATION = `mutation FeedbackFileUpload($contentType: String!, $filename: String!, $size: Int!) {
  fileUpload(contentType: $contentType, filename: $filename, size: $size) {
    success
    uploadFile { uploadUrl assetUrl headers { key value } }
  }
}`;

const ISSUE_CREATE_MUTATION = `mutation FeedbackIssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue { identifier url }
  }
}`;

const CUSTOMER_NEED_CREATE_MUTATION = `mutation FeedbackCustomerNeedCreate($input: CustomerNeedCreateInput!) {
  customerNeedCreate(input: $input) {
    success
  }
}`;

export class LinearIssueTracker implements IssueTracker {
	private readonly auth: LinearAuth;
	private readonly config: LinearFeedbackConfig;
	private readonly fetch: FetchLike;
	private readonly timeoutMs: number;

	constructor({
		auth,
		config = DEFAULT_LINEAR_FEEDBACK_CONFIG,
		fetch = (url, init) => globalThis.fetch(url, init),
		timeoutMs = DEFAULT_TIMEOUT_MS,
	}: LinearIssueTrackerOptions) {
		this.auth = auth;
		this.config = config;
		this.fetch = fetch;
		this.timeoutMs = timeoutMs;
	}

	async uploadAttachment({ filename, contentType, bytes }: IssueAttachment): Promise<string> {
		const { data } = await this.graphql(
			FILE_UPLOAD_MUTATION,
			{ contentType, filename, size: bytes.byteLength },
			fileUploadResponseSchema,
		);
		const upload = data.fileUpload.uploadFile;
		if (!data.fileUpload.success || !upload) {
			throw new IssueTrackerError("Linear did not return an upload URL.");
		}

		const headers = new Headers({
			"Content-Type": contentType,
			"Cache-Control": LINEAR_UPLOAD_CACHE_CONTROL,
		});
		for (const { key, value } of upload.headers) headers.set(key, value);

		const response = await this.send(upload.uploadUrl, {
			method: "PUT",
			headers,
			body: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: contentType }),
		});
		if (!response.ok) {
			throw new IssueTrackerError(`Linear file upload failed with status ${response.status}.`);
		}
		return upload.assetUrl;
	}

	async createIssue(draft: FeedbackIssueDraft): Promise<FeedbackIssueView> {
		const { data } = await this.graphql(
			ISSUE_CREATE_MUTATION,
			{ input: toLinearIssueInput(draft, this.config, { asApp: this.auth.mode === "app" }) },
			issueCreateResponseSchema,
		);
		const issue = data.issueCreate.issue;
		if (!data.issueCreate.success || !issue) {
			throw new IssueTrackerError("Linear did not create the issue.");
		}
		if (draft.type === "bug") {
			return { identifier: issue.identifier, url: issue.url };
		}
		const customerNeed = await this.graphql(
			CUSTOMER_NEED_CREATE_MUTATION,
			{
				input: toLinearCustomerNeedInput(draft, issue.identifier, {
					asApp: this.auth.mode === "app",
				}),
			},
			customerNeedCreateResponseSchema,
		);
		if (!customerNeed.data.customerNeedCreate.success) {
			throw new IssueTrackerError("Linear did not create the customer request.");
		}
		return { identifier: issue.identifier, url: issue.url };
	}

	private async graphql<T extends z.ZodType>(
		query: string,
		variables: Record<string, unknown>,
		schema: T,
	): Promise<z.output<T>> {
		const body = JSON.stringify({ query, variables });
		let response = await this.post(body);
		if (response.status === 401 && this.auth.mode === "app") {
			this.auth.invalidate();
			response = await this.post(body);
		}
		const payload: unknown = await response.json().catch(() => null);
		const errors = linearErrorsSchema.safeParse(payload);
		if (errors.success) {
			const messages = errors.data.errors.map((error) => error.message).join("; ");
			throw new IssueTrackerError(`Linear returned errors (${response.status}): ${messages}`);
		}
		if (!response.ok)
			throw new IssueTrackerError(`Linear responded with status ${response.status}.`);
		const parsed = schema.safeParse(payload);
		if (!parsed.success) throw new IssueTrackerError("Linear returned an unexpected response.");
		return parsed.data;
	}

	private async post(body: string): Promise<Response> {
		const authorization = await this.auth.authorization();
		return this.send(LINEAR_GRAPHQL_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: authorization },
			body,
		});
	}

	private async send(url: string, init: RequestInit): Promise<Response> {
		try {
			return await this.fetch(url, { ...init, signal: AbortSignal.timeout(this.timeoutMs) });
		} catch (error) {
			throw new IssueTrackerError("Could not reach Linear.", { cause: error });
		}
	}
}
