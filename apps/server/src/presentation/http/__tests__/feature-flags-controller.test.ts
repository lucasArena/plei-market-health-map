import { NotFoundError } from "@market-health-map/core/application";
import { resetServerEnvCache } from "@server/env";
import { createApiApp } from "@server/presentation/http/api-app";

const FLAG = {
	key: "new-panel",
	enabled: true,
	updatedBy: "stefano@plei.com",
	updatedAt: "2026-10-01T15:00:00.000Z",
};

function setup(email = "stefano@plei.com") {
	const services = {
		listEnabledFeatureFlags: vi.fn().mockResolvedValue({ enabled: ["new-panel"] }),
		listFeatureFlags: vi.fn().mockResolvedValue([FLAG]),
		setFeatureFlag: vi.fn().mockResolvedValue(FLAG),
	};
	const resolveAccess = vi.fn().mockResolvedValue({
		status: "allowed",
		userId: "g-1",
		email,
		name: null,
	});
	const app = createApiApp({ resolveAccess, services: () => services as never });
	const put = (key: string, body: string) =>
		app.request(`http://localhost/api/v1/feature-flags/${key}`, {
			method: "PUT",
			body,
			headers: { "content-type": "application/json" },
		});
	return { app, put, services };
}

describe("feature flags controller", () => {
	beforeEach(() => vi.stubEnv("ADMIN_EMAILS", "stefano@plei.com"));
	afterEach(() => {
		vi.unstubAllEnvs();
		resetServerEnvCache();
	});

	it("tells any signed-in person which flags are on", async () => {
		const { app } = setup("alan@plei.com");

		const response = await app.request("http://localhost/api/v1/feature-flags");

		expect(await response.json()).toEqual({ data: { enabled: ["new-panel"] } });
	});

	it("lists every flag and switches one for admins, recording who did it", async () => {
		const { app, put, services } = setup();

		const list = await app.request("http://localhost/api/v1/feature-flags/all");
		const switched = await put("new-panel", JSON.stringify({ enabled: false }));

		expect(await list.json()).toEqual({ data: [FLAG] });
		expect(switched.status).toBe(200);
		expect(services.setFeatureFlag).toHaveBeenCalledWith({
			key: "new-panel",
			enabled: false,
			updatedBy: "stefano@plei.com",
		});
	});

	it("forbids listing and switching flags for anyone else", async () => {
		const { app, put, services } = setup("alan@plei.com");

		const list = await app.request("http://localhost/api/v1/feature-flags/all");
		const switched = await put("new-panel", JSON.stringify({ enabled: true }));

		expect(list.status).toBe(403);
		expect(switched.status).toBe(403);
		expect(services.setFeatureFlag).not.toHaveBeenCalled();
	});

	it("answers 400 for a body that is not JSON and 404 for a flag that is not in code", async () => {
		const { put, services } = setup();

		const notJson = await put("new-panel", "nope");
		services.setFeatureFlag.mockRejectedValueOnce(new NotFoundError("Feature flag"));
		const unknown = await put("removed", JSON.stringify({ enabled: true }));
		const empty = await put("new-panel", "null");

		expect(notJson.status).toBe(400);
		expect(unknown.status).toBe(404);
		expect(empty.status).toBe(200);
		expect(services.setFeatureFlag).toHaveBeenLastCalledWith({
			key: "new-panel",
			enabled: undefined,
			updatedBy: "stefano@plei.com",
		});
	});
});
