import { getRequestLocale } from "@/server/i18n/get-request-locale";

const mockHeaders = vi.fn();

vi.mock("next/headers", () => ({ headers: () => mockHeaders() }));

describe("getRequestLocale", () => {
	it("reads the locale from accept-language", async () => {
		mockHeaders.mockResolvedValue(new Headers({ "accept-language": "pt-BR,pt;q=0.9" }));
		await expect(getRequestLocale()).resolves.toBe("pt-BR");
	});

	it("defaults to English", async () => {
		mockHeaders.mockResolvedValue(new Headers());
		await expect(getRequestLocale()).resolves.toBe("en");
	});
});
