import { z } from "zod";
import { JsonPreference } from "@/infrastructure/cache/local-storage/json-preference/json-preference";

const schema = z.object({ count: z.number().int() });

function memoryStorage(): Storage {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key) => values.get(key) ?? null,
		key: (index) => [...values.keys()][index] ?? null,
		removeItem: (key) => {
			values.delete(key);
		},
		setItem: (key, value) => {
			values.set(key, value);
		},
	};
}

describe("JsonPreference", () => {
	it("remembers a value and reads it back", () => {
		const storage = memoryStorage();
		const preference = new JsonPreference("test:key", schema, () => storage);

		expect(preference.read()).toBeNull();
		preference.remember({ count: 3 });

		expect(storage.getItem("test:key")).toBe('{"count":3}');
		expect(preference.read()).toEqual({ count: 3 });
	});

	it("ignores values that are not valid JSON or no longer match the shape", () => {
		const storage = memoryStorage();
		const preference = new JsonPreference("test:key", schema, () => storage);

		storage.setItem("test:key", "{oops");
		expect(preference.read()).toBeNull();
		storage.setItem("test:key", '{"count":"three"}');
		expect(preference.read()).toBeNull();
	});

	it("keeps working when storage is unavailable or throws", () => {
		expect(new JsonPreference("test:key", schema, () => null).read()).toBeNull();
		const throwing = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("full");
			},
		} as unknown as Storage;
		const preference = new JsonPreference("test:key", schema, () => throwing);

		expect(preference.read()).toBeNull();
		expect(() => preference.remember({ count: 1 })).not.toThrow();
		expect(new JsonPreference("test:key", schema).read()).toBeNull();
	});
});
