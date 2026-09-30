import { resetServerEnvCache } from "@server/env";
import { createApiApp } from "@server/presentation/http/api-app";
import type { ApiTestBody } from "@server/testing/api-response.types";

function setup() {
	const services = {
		recordDailyActivity: vi.fn().mockResolvedValue(undefined),
		getAppMetrics: vi.fn().mockResolvedValue({ targetPercent: 82 }),
		listAppMetricsPeople: vi.fn().mockResolvedValue({ rows: [], page: 2, pageCount: 3 }),
	};
	const resolveAccess = vi.fn().mockResolvedValue({
		status: "allowed",
		userId: "g-1",
		email: "stefano@plei.com",
		name: "Stefano Sanchez",
	});
	const app = createApiApp({ resolveAccess, services: () => services as never });
	const post = (body: string) =>
		app.request("http://localhost/api/v1/activity", {
			method: "POST",
			body,
			headers: { "content-type": "application/json" },
		});
	return { app, post, services };
}

describe("activity controller", () => {
	it("records the report for the signed-in user, never one from the body", async () => {
		const { post, services } = setup();

		const response = await post(
			JSON.stringify({ minutes: 5, counters: { searches: 2 }, email: "someone-else@plei.com" }),
		);

		expect(response.status).toBe(204);
		expect(services.recordDailyActivity).toHaveBeenCalledWith({
			user: { userId: "g-1", email: "stefano@plei.com", name: "Stefano Sanchez" },
			report: { minutes: 5, counters: { searches: 2 }, email: "someone-else@plei.com" },
		});
	});

	it("treats an empty body as a plain visit", async () => {
		const { post, services } = setup();

		expect((await post("")).status).toBe(204);
		expect(services.recordDailyActivity).toHaveBeenCalledWith(
			expect.objectContaining({ report: {} }),
		);
	});

	it("rejects bodies that aren't JSON or are too large", async () => {
		const { post, services } = setup();

		const notJson = await post("not json");
		const tooLarge = await post(JSON.stringify({ padding: "x".repeat(3000) }));

		expect(notJson.status).toBe(400);
		expect(((await notJson.json()) as ApiTestBody).error.code).toBe("VALIDATION_ERROR");
		expect(tooLarge.status).toBe(400);
		expect(services.recordDailyActivity).not.toHaveBeenCalled();
	});
});

describe("metrics controller", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		resetServerEnvCache();
	});

	it("returns the weekly metrics and a page of people", async () => {
		vi.stubEnv("APP_METRICS_VIEWER_EMAILS", "stefano@plei.com");
		const { app, services } = setup();

		const metrics = await app.request("http://localhost/api/v1/metrics");
		const people = await app.request("http://localhost/api/v1/metrics/people?page=2&pageSize=5");

		expect(await metrics.json()).toEqual({ data: { targetPercent: 82 } });
		expect(await people.json()).toEqual({ data: { rows: [], page: 2, pageCount: 3 } });
		expect(services.listAppMetricsPeople).toHaveBeenCalledWith({ page: "2", pageSize: "5" });
	});

	it("forbids anyone who is not an App metrics viewer", async () => {
		vi.stubEnv("APP_METRICS_VIEWER_EMAILS", "lucas@plei.com");
		const { app, services } = setup();

		const metrics = await app.request("http://localhost/api/v1/metrics");

		expect(metrics.status).toBe(403);
		expect(services.getAppMetrics).not.toHaveBeenCalled();
	});
});
