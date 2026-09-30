import {
	InvalidRequestError,
	MAX_FEEDBACK_REQUEST_BYTES,
	PayloadTooLargeError,
} from "@market-health-map/core/application";
import type { ApiEnv, ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export const FEEDBACK_IMAGES_FIELD = "images";

function assertDeclaredLength(request: Request, limit: number): void {
	const declared = Number(request.headers.get("content-length"));
	if (Number.isFinite(declared) && declared > limit) throw new PayloadTooLargeError(limit);
}

async function readLimitedBody(request: Request, limit: number): Promise<Uint8Array> {
	const chunks: Uint8Array[] = [];
	let total = 0;
	const reader = request.body?.getReader();
	while (reader) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > limit) {
			reader.releaseLock();
			throw new PayloadTooLargeError(limit);
		}
		chunks.push(value);
	}
	const body = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		body.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return body;
}

async function readForm(request: Request, limit: number): Promise<FormData> {
	assertDeclaredLength(request, limit);
	const body = await readLimitedBody(request, limit);
	try {
		const headers = { "content-type": request.headers.get("content-type") ?? "" };
		return await new Response(body as Uint8Array<ArrayBuffer>, { headers }).formData();
	} catch {
		throw new InvalidRequestError([
			{ code: "invalid_type", path: [], message: "Expected a multipart/form-data body." },
		]);
	}
}

function text(form: FormData, field: string): string | undefined {
	const value = form.get(field);
	return typeof value === "string" ? value : undefined;
}

async function readImages(form: FormData) {
	const entries = form.getAll(FEEDBACK_IMAGES_FIELD);
	const invalid = entries.findIndex((entry) => typeof entry === "string");
	if (invalid >= 0) {
		throw new InvalidRequestError([
			{ code: "invalid_type", path: [FEEDBACK_IMAGES_FIELD, invalid], message: "Expected a file." },
		]);
	}
	return Promise.all(
		(entries as File[]).map(async (file) => ({
			filename: file.name,
			contentType: file.type,
			bytes: new Uint8Array(await file.arrayBuffer()),
		})),
	);
}

export function feedbackRoutes(
	services: () => ApiServices,
	maxRequestBytes: number = MAX_FEEDBACK_REQUEST_BYTES,
) {
	return new Hono<ApiEnv>().post("/", async (context) => {
		const form = await readForm(context.req.raw, maxRequestBytes);
		const principal = context.get("principal");
		const created = await services().submitFeedback({
			type: text(form, "type") ?? "",
			message: text(form, "message") ?? "",
			pageUrl: text(form, "pageUrl"),
			view: text(form, "view"),
			images: await readImages(form),
			submitter: { name: principal.name, email: principal.email },
		});
		return ok(created, { status: 201 });
	});
}
