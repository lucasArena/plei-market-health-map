import type {
	ErrorBody,
	ErrorEnvelope,
	OkInit,
	SuccessEnvelope,
} from "@server/presentation/http/respond.types";

export function ok<T>(data: T, init: OkInit = {}): Response {
	const body: SuccessEnvelope<T> = { data };
	if (init.meta) body.meta = init.meta;
	return Response.json(body, { status: init.status ?? 200 });
}

export function fail(code: string, message: string, status: number, details?: unknown): Response {
	const error: ErrorBody = { code, message };
	if (details !== undefined) error.details = details;
	const body: ErrorEnvelope = { error };
	return Response.json(body, { status });
}
