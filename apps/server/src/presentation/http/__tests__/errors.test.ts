import {
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@market-health-map/core/application";
import { ValidationError } from "@market-health-map/core/domain";
import { toErrorResponse } from "@server/presentation/http/errors";
import type { ApiTestBody } from "@server/testing/api-response.types";
import { EN_MESSAGES } from "@server/testing/messages";
import { z } from "zod";

async function mapped(error: unknown) {
	const response = toErrorResponse(error, EN_MESSAGES);
	return { status: response.status, body: (await response.json()) as ApiTestBody };
}

describe("toErrorResponse", () => {
	it("maps zod errors to 422 with issues", async () => {
		const result = z.object({ a: z.string() }).safeParse({});
		const { status, body } = await mapped(result.error);
		expect(status).toBe(422);
		expect(body.error.code).toBe("VALIDATION_ERROR");
		expect(body.error.details).toHaveLength(1);
	});

	it("maps domain validation errors to 422", async () => {
		expect((await mapped(new ValidationError("bad"))).status).toBe(422);
	});

	it("maps unauthorized to 401 with localized copy", async () => {
		const { status, body } = await mapped(new UnauthorizedError());
		expect(status).toBe(401);
		expect(body.error.message).toBe(EN_MESSAGES.errors.unauthorized);
	});

	it("maps forbidden to 403", async () => {
		expect((await mapped(new ForbiddenError("market"))).status).toBe(403);
	});

	it("maps not found to 404", async () => {
		expect((await mapped(new NotFoundError("Market"))).status).toBe(404);
	});

	it("hides unknown errors behind a 500", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const { status, body } = await mapped(new Error("boom"));
		expect(status).toBe(500);
		expect(body.error.message).toBe(EN_MESSAGES.errors.internal);
		await mapped("raw");
		expect(spy).toHaveBeenCalledWith("[api-error]", "raw");
		spy.mockRestore();
	});
});
