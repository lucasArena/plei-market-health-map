import type { z } from "zod";
import type { ResolveStorage } from "@/infrastructure/cache/local-storage/json-preference/json-preference.types";

function browserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export class JsonPreference<Value> {
	constructor(
		private readonly key: string,
		private readonly schema: z.ZodType<Value>,
		private readonly resolveStorage: ResolveStorage = browserStorage,
	) {}

	read(): Value | null {
		try {
			const stored = this.resolveStorage()?.getItem(this.key);
			if (!stored) return null;
			const parsed = this.schema.safeParse(JSON.parse(stored));
			return parsed.success ? parsed.data : null;
		} catch {
			return null;
		}
	}

	remember(value: Value): void {
		try {
			this.resolveStorage()?.setItem(this.key, JSON.stringify(value));
		} catch {
			return;
		}
	}
}
