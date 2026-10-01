import { InvalidRequestError, NotFoundError } from "@market-health-map/core/application";
import { createApiApp } from "@server/presentation/http/api-app";
import type { AccessDecision } from "@server/presentation/http/authenticate.types";
import type { ApiTestBody } from "@server/testing/api-response.types";

const ALLOWED: AccessDecision = { status: "allowed", userId: "g-1", email: "lucas@plei.com" };

function setup(access: AccessDecision = ALLOWED) {
	const services = {
		listFacilities: vi.fn().mockResolvedValue([{ id: "f1" }]),
		getFacilityDetail: vi.fn().mockResolvedValue({ facility: { id: "889" } }),
		getFacilityReservationStats: vi.fn().mockResolvedValue({ playedLastWeek: 55 }),
		getFacilityPlayerStats: vi.fn().mockResolvedValue({ uniquePlayersLast28Days: 126 }),
		getMarketGameInsights: vi.fn().mockResolvedValue([]),
		getMarketSummary: vi.fn().mockResolvedValue({ scope: { facilityCount: 42 } }),
		getMarketPlayerStats: vi.fn().mockResolvedValue({ uniquePlayersLast28Days: 900 }),
		listAppSessionHeatmap: vi.fn().mockResolvedValue([{ h3: "x", sessions: 3 }]),
		listRecentLogins: vi.fn().mockResolvedValue([{ id: "l1" }]),
		submitFeedback: vi.fn().mockResolvedValue({ identifier: "REQ-1", url: "https://linear.app/x" }),
		recordDailyActivity: vi.fn().mockResolvedValue(undefined),
		getAppMetrics: vi.fn().mockResolvedValue({ targetPercent: 82 }),
		listAppMetricsPeople: vi.fn().mockResolvedValue({ rows: [], page: 2 }),
		listEnabledFeatureFlags: vi.fn().mockResolvedValue({ enabled: [] }),
		listFeatureFlags: vi.fn().mockResolvedValue([]),
		setFeatureFlag: vi.fn(),
	};
	const resolveAccess = vi.fn().mockResolvedValue(access);
	const app = createApiApp({ resolveAccess, services: () => services });
	const get = async (path: string, headers: Record<string, string> = {}) => {
		const response = await app.request(`http://localhost/api/v1${path}`, { headers });
		return { status: response.status, body: (await response.json()) as ApiTestBody };
	};
	return { get, services, resolveAccess };
}

describe("createApiApp", () => {
	it("lists facilities for a signed-in user", async () => {
		const { get, resolveAccess } = setup();

		expect(await get("/facilities")).toEqual({ status: 200, body: { data: [{ id: "f1" }] } });
		expect(resolveAccess).toHaveBeenCalledWith(expect.any(Request));
	});

	it("returns one facility's detail", async () => {
		const { get, services } = setup();

		expect(await get("/facilities/889")).toEqual({
			status: 200,
			body: { data: { facility: { id: "889" } } },
		});
		expect(services.getFacilityDetail).toHaveBeenCalledWith({ facilityId: "889" });
	});

	it("returns reservation and player analytics independently", async () => {
		const { get, services } = setup();

		expect((await get("/facilities/889/reservations")).body).toEqual({
			data: { playedLastWeek: 55 },
		});
		expect((await get("/facilities/889/players")).body).toEqual({
			data: { uniquePlayersLast28Days: 126 },
		});
		expect(services.getFacilityReservationStats).toHaveBeenCalledWith({ facilityId: "889" });
		expect(services.getFacilityPlayerStats).toHaveBeenCalledWith({ facilityId: "889" });
	});

	it("returns the market-wide summary and its player analytics separately", async () => {
		const { get, services } = setup();

		expect(await get("/market-summary")).toEqual({
			status: 200,
			body: { data: { scope: { facilityCount: 42 } } },
		});
		expect(await get("/market-summary/players")).toEqual({
			status: 200,
			body: { data: { uniquePlayersLast28Days: 900 } },
		});
		expect(services.getMarketSummary).toHaveBeenCalledWith({ market: undefined });
		expect(services.getMarketPlayerStats).toHaveBeenCalledWith({ market: undefined });
	});

	it("passes the market filter through to both market summary endpoints", async () => {
		const { get, services } = setup();

		await get("/market-summary?market=philly");
		await get("/market-summary/players?market=philly");

		expect(services.getMarketSummary).toHaveBeenCalledWith({ market: "philly" });
		expect(services.getMarketPlayerStats).toHaveBeenCalledWith({ market: "philly" });
	});

	it("maps an unknown market to 404 and an invalid one to 400", async () => {
		const { get, services } = setup();
		services.getMarketSummary.mockRejectedValueOnce(new NotFoundError("Market"));
		services.getMarketPlayerStats.mockRejectedValueOnce(new InvalidRequestError([]));

		expect((await get("/market-summary?market=nowhere")).status).toBe(404);
		expect((await get("/market-summary/players?market=")).status).toBe(400);
	});

	it("rejects anonymous market summary requests before running any query", async () => {
		const { get, services } = setup({ status: "anonymous" });

		const { status, body } = await get("/market-summary");

		expect(status).toBe(401);
		expect(body.error.code).toBe("UNAUTHORIZED");
		expect(services.getMarketSummary).not.toHaveBeenCalled();
	});

	it("returns the app session heatmap", async () => {
		const { get } = setup();

		expect((await get("/app-session-heatmap")).body).toEqual({ data: [{ h3: "x", sessions: 3 }] });
	});

	it("passes the logins limit through", async () => {
		const { get, services } = setup();

		expect((await get("/logins?limit=5")).body).toEqual({ data: [{ id: "l1" }] });
		expect(services.listRecentLogins).toHaveBeenCalledWith({ limit: "5" });
		await get("/logins");
		expect(services.listRecentLogins).toHaveBeenLastCalledWith({ limit: undefined });
	});

	it("rejects anonymous requests before reaching the use cases", async () => {
		const { get, services } = setup({ status: "anonymous" });

		const { status, body } = await get("/facilities");

		expect(status).toBe(401);
		expect(body.error.code).toBe("UNAUTHORIZED");
		expect(services.listFacilities).not.toHaveBeenCalled();
	});

	it("forbids non-Plei accounts, in the viewer's language", async () => {
		const { get } = setup({ status: "denied", email: "a@gmail.com" });

		const { status, body } = await get("/facilities", { "accept-language": "pt-BR" });

		expect(status).toBe(403);
		expect(body.error.message).toMatch(/[ãçéõ]/);
	});

	it("answers unknown routes with 404", async () => {
		const { get } = setup();

		const { status, body } = await get("/nope");

		expect(status).toBe(404);
		expect(body.error.code).toBe("NOT_FOUND");
	});

	it("uses the real container by default", () => {
		expect(createApiApp({ resolveAccess: vi.fn() })).toBeDefined();
	});
});

describe("market insights route", () => {
	it("loads insights through their own authenticated scoped endpoint", async () => {
		const { get, services } = setup();
		expect(await get("/market-summary/insights?market=houston")).toEqual({
			status: 200,
			body: { data: [] },
		});
		expect(services.getMarketGameInsights).toHaveBeenCalledWith({ market: "houston" });
		expect(services.getMarketSummary).not.toHaveBeenCalled();
	});
});
