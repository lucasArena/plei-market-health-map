export interface SuccessEnvelope<T> {
	data: T;
	meta?: Record<string, unknown>;
}

export interface ErrorBody {
	code: string;
	message: string;
	details?: unknown;
}

export interface ErrorEnvelope {
	error: ErrorBody;
}

export interface OkInit {
	status?: number;
	meta?: Record<string, unknown>;
}
