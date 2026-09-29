import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";

describe("PLEIFUL_COLORS", () => {
	it("exposes the Figma global color scales", () => {
		expect(PLEIFUL_COLORS.pitchGreen[50]).toBe("#16755C");
		expect(PLEIFUL_COLORS.pitchGreen[80]).toBe("#0B3B2E");
		expect(PLEIFUL_COLORS.sky[50]).toBe("#0EA5E9");
		expect(PLEIFUL_COLORS.moonlight[50]).toBe("#8B5CF6");
		expect(PLEIFUL_COLORS.orchid[50]).toBe("#D946EF");
		expect(PLEIFUL_COLORS.sangria[50]).toBe("#FF6333");
	});

	it("keeps every scale value as a six-digit hex color", () => {
		const scales = Object.values(PLEIFUL_COLORS).filter((value) => typeof value === "object");
		for (const scale of scales) {
			for (const color of Object.values(scale as Record<string, string>)) {
				expect(color).toMatch(/^#[0-9A-F]{6}$/);
			}
		}
	});
});
