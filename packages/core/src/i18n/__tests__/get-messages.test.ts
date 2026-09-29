import { getMessages, parseAcceptLanguage } from "@core/i18n/get-messages";
import { isLocale } from "@core/i18n/locales";
import { en } from "@core/i18n/messages/en";
import { ptBR } from "@core/i18n/messages/pt-BR";

function keyPaths(value: object, prefix = ""): string[] {
	return Object.entries(value).flatMap(([key, child]) =>
		typeof child === "object" ? keyPaths(child, `${prefix}${key}.`) : [`${prefix}${key}`],
	);
}

describe("getMessages", () => {
	it("returns the catalog for each locale", () => {
		expect(getMessages("en")).toBe(en);
		expect(getMessages("pt-BR")).toBe(ptBR);
	});

	it("keeps every locale in sync with English", () => {
		expect(keyPaths(ptBR)).toEqual(keyPaths(en));
	});
});

describe("parseAcceptLanguage", () => {
	it("falls back to English without a header", () => {
		expect(parseAcceptLanguage(null)).toBe("en");
	});

	it("matches an exact supported tag", () => {
		expect(parseAcceptLanguage("pt-BR,pt;q=0.9")).toBe("pt-BR");
	});

	it("maps a base language to its regional catalog", () => {
		expect(parseAcceptLanguage("fr-FR, pt-PT;q=0.8")).toBe("pt-BR");
	});

	it("skips empty and unknown tags", () => {
		expect(parseAcceptLanguage(" ,de-DE")).toBe("en");
	});
});

describe("isLocale", () => {
	it("recognizes supported locales only", () => {
		expect(isLocale("en")).toBe(true);
		expect(isLocale("de")).toBe(false);
	});
});
