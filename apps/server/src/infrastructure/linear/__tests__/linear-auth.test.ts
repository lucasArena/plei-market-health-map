import { IssueTrackerError } from "@market-health-map/core/application";
import {
	LINEAR_APP_SCOPE,
	LINEAR_OAUTH_TOKEN_URL,
	LINEAR_TOKEN_REFRESH_MARGIN_MS,
	LinearApiKeyAuth,
	LinearAppAuth,
} from "@server/infrastructure/linear/linear-auth";

const DAY_S = 24 * 60 * 60;
const tokenOk = (token: string, expiresIn = 30 * DAY_S) =>
	Response.json({ access_token: token, token_type: "Bearer", expires_in: expiresIn });

function setup(...responses: Array<Response | Error>) {
	let now = 1_000_000;
	const fetch = vi.fn(async (_url: string, _init: RequestInit) => {
		const next = responses.shift();
		if (next instanceof Error) throw next;
		return next ?? new Response(null, { status: 500 });
	});
	const auth = new LinearAppAuth({
		clientId: "client-id",
		clientSecret: "client-secret",
		fetch,
		now: () => now,
	});
	const advance = (ms: number) => {
		now += ms;
	};
	return { auth, fetch, advance };
}

describe("LinearApiKeyAuth", () => {
	it("sends the personal key as is, without a Bearer prefix", async () => {
		const auth = new LinearApiKeyAuth("lin_api_test");

		auth.invalidate();

		expect(auth.mode).toBe("api-key");
		await expect(auth.authorization()).resolves.toBe("lin_api_test");
	});
});

describe("LinearAppAuth", () => {
	it("exchanges the client credentials for a Bearer token", async () => {
		const { auth, fetch } = setup(tokenOk("app_token"));

		await expect(auth.authorization()).resolves.toBe("Bearer app_token");

		expect(auth.mode).toBe("app");
		const [url, init] = fetch.mock.calls[0] ?? [];
		expect(url).toBe(LINEAR_OAUTH_TOKEN_URL);
		expect(init).toMatchObject({
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
		});
		expect(Object.fromEntries(new URLSearchParams(init?.body as string))).toEqual({
			grant_type: "client_credentials",
			client_id: "client-id",
			client_secret: "client-secret",
			scope: LINEAR_APP_SCOPE,
		});
		expect(LINEAR_APP_SCOPE).toBe("read,write");
	});

	it("caches the token until shortly before it expires", async () => {
		const { auth, fetch, advance } = setup(tokenOk("first", 3600), tokenOk("second", 3600));

		await auth.authorization();
		advance(3600 * 1000 - LINEAR_TOKEN_REFRESH_MARGIN_MS - 1);
		await expect(auth.authorization()).resolves.toBe("Bearer first");
		expect(fetch).toHaveBeenCalledTimes(1);

		advance(1);
		await expect(auth.authorization()).resolves.toBe("Bearer second");
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("shares one token request between concurrent callers", async () => {
		const { auth, fetch } = setup(tokenOk("app_token"));

		const tokens = await Promise.all([auth.authorization(), auth.authorization()]);

		expect(tokens).toEqual(["Bearer app_token", "Bearer app_token"]);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("requests a new token after being invalidated", async () => {
		const { auth, fetch } = setup(tokenOk("first"), tokenOk("second"));

		await auth.authorization();
		auth.invalidate();

		await expect(auth.authorization()).resolves.toBe("Bearer second");
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it.each([
		[
			"a rejected exchange",
			() => Response.json({ error: "invalid_client" }, { status: 401 }),
			/status 401/,
		],
		["an unexpected payload", () => Response.json({ token: "x" }), /unexpected token response/],
		["a non-JSON body", () => new Response("nope"), /unexpected token response/],
	])("fails on %s without caching", async (_label, response, message) => {
		const { auth, fetch } = setup(response(), tokenOk("app_token"));

		await expect(auth.authorization()).rejects.toThrow(message);
		await expect(auth.authorization()).resolves.toBe("Bearer app_token");
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("wraps network failures with the cause", async () => {
		const cause = new TypeError("fetch failed");
		const { auth } = setup(cause);

		const error = await auth.authorization().catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(IssueTrackerError);
		expect(error).toMatchObject({ message: "Could not reach Linear.", cause });
	});

	it("uses the global fetch and clock by default", async () => {
		const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(tokenOk("app_token"));

		await expect(
			new LinearAppAuth({ clientId: "a", clientSecret: "b" }).authorization(),
		).resolves.toBe("Bearer app_token");

		expect(spy).toHaveBeenCalledWith(
			LINEAR_OAUTH_TOKEN_URL,
			expect.objectContaining({ method: "POST" }),
		);
		spy.mockRestore();
	});
});
