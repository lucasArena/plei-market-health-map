export interface ApiTestBody {
	data?: unknown;
	error: { code: string; message: string; details?: unknown[] };
}
