import type { ApiErrorPayload } from "@/infrastructure/api/client.types";

export class ApiError extends Error {
	readonly code: string;
	readonly status: number;

	constructor(status: number, payload: ApiErrorPayload) {
		super(payload.message);
		this.name = "ApiError";
		this.code = payload.code;
		this.status = status;
	}
}

const UNKNOWN_ERROR: ApiErrorPayload = { code: "UNKNOWN_ERROR", message: "Request failed." };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		...init,
		credentials: "include",
		headers: { "Content-Type": "application/json", ...init?.headers },
	});
	const body = await response.json().catch(() => null);
	if (!response.ok) throw new ApiError(response.status, body?.error ?? UNKNOWN_ERROR);
	return body.data as T;
}

export const apiClient = {
	get: <T>(path: string) => request<T>(path),
	put: <T>(path: string, body: unknown) =>
		request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
};
