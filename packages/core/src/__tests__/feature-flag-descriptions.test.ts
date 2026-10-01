import { FEATURE_FLAG_KEYS } from "@core/application/dtos/feature-flags-dto";
import { en } from "@core/i18n/messages/en";
import { es } from "@core/i18n/messages/es";
import { ptBR } from "@core/i18n/messages/pt-BR";

describe("feature flag keys", () => {
	it("are unique kebab-case keys with a description in every language", () => {
		const keys: readonly string[] = FEATURE_FLAG_KEYS;

		expect(new Set(keys).size).toBe(keys.length);
		for (const key of keys) {
			expect(key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
			expect(en.featureFlags.descriptions[key]).toBeTruthy();
			expect(ptBR.featureFlags.descriptions[key]).toBeTruthy();
			expect(es.featureFlags.descriptions[key]).toBeTruthy();
		}
		expect(Object.keys(en.featureFlags.descriptions).sort()).toEqual([...keys].sort());
		expect(Object.keys(ptBR.featureFlags.descriptions).sort()).toEqual([...keys].sort());
		expect(Object.keys(es.featureFlags.descriptions).sort()).toEqual([...keys].sort());
	});
});
