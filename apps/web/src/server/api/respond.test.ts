import { fail, ok } from "@/server/api/respond";

describe("respond", () => {
	it("wraps data in a success envelope", async () => {
		const response = ok({ id: 1 });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ data: { id: 1 } });
	});

	it("includes meta and a custom status", async () => {
		const response = ok([], { status: 201, meta: { total: 0 } });
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ data: [], meta: { total: 0 } });
	});

	it("builds an error envelope", async () => {
		const response = fail("NOPE", "No.", 400);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: { code: "NOPE", message: "No." } });
	});

	it("includes error details when present", async () => {
		expect(await fail("NOPE", "No.", 422, ["x"]).json()).toEqual({
			error: { code: "NOPE", message: "No.", details: ["x"] },
		});
	});
});
