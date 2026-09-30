import { IssueTrackerError } from "@market-health-map/core/application";
import type {
	LinearAppAuthOptions,
	LinearAuth,
} from "@server/infrastructure/linear/linear-auth.types";
import type { FetchLike } from "@server/infrastructure/linear/linear-issue-tracker.types";
import { oauthTokenResponseSchema } from "@server/infrastructure/linear/linear-responses";

export const LINEAR_OAUTH_TOKEN_URL = "https://api.linear.app/oauth/token";
export const LINEAR_APP_SCOPE = "read,write";
export const LINEAR_TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 20_000;

export class LinearApiKeyAuth implements LinearAuth {
	readonly mode = "api-key" as const;
	private readonly apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	authorization(): Promise<string> {
		return Promise.resolve(this.apiKey);
	}

	invalidate(): void {}
}

interface CachedToken {
	accessToken: string;
	expiresAt: number;
}

export class LinearAppAuth implements LinearAuth {
	readonly mode = "app" as const;
	private readonly clientId: string;
	private readonly clientSecret: string;
	private readonly scope: string;
	private readonly fetch: FetchLike;
	private readonly now: () => number;
	private readonly timeoutMs: number;
	private token: CachedToken | undefined;
	private pending: Promise<CachedToken> | undefined;

	constructor({
		clientId,
		clientSecret,
		scope = LINEAR_APP_SCOPE,
		fetch = (url, init) => globalThis.fetch(url, init),
		now = () => Date.now(),
		timeoutMs = DEFAULT_TIMEOUT_MS,
	}: LinearAppAuthOptions) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.scope = scope;
		this.fetch = fetch;
		this.now = now;
		this.timeoutMs = timeoutMs;
	}

	async authorization(): Promise<string> {
		if (!this.token || this.now() >= this.token.expiresAt - LINEAR_TOKEN_REFRESH_MARGIN_MS) {
			this.pending ??= this.requestToken().finally(() => {
				this.pending = undefined;
			});
			this.token = await this.pending;
		}
		return `Bearer ${this.token.accessToken}`;
	}

	invalidate(): void {
		this.token = undefined;
	}

	private async requestToken(): Promise<CachedToken> {
		const requestedAt = this.now();
		let response: Response;
		try {
			response = await this.fetch(LINEAR_OAUTH_TOKEN_URL, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: this.clientId,
					client_secret: this.clientSecret,
					scope: this.scope,
				}).toString(),
				signal: AbortSignal.timeout(this.timeoutMs),
			});
		} catch (error) {
			throw new IssueTrackerError("Could not reach Linear.", { cause: error });
		}
		if (!response.ok) {
			throw new IssueTrackerError(`Linear token request failed with status ${response.status}.`);
		}
		const parsed = oauthTokenResponseSchema.safeParse(await response.json().catch(() => null));
		if (!parsed.success)
			throw new IssueTrackerError("Linear returned an unexpected token response.");
		return {
			accessToken: parsed.data.access_token,
			expiresAt: requestedAt + parsed.data.expires_in * 1000,
		};
	}
}
