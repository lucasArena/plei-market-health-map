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
		listAppSessionHeatmap: vi.fn().mockResolvedValue([{ h3: "x", sessions: 3 }]),
		listRecentLogins: vi.fn().mockResolvedValue([{ id: "l1" }]),
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
