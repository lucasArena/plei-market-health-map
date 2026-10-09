import { drillDownComparisonWindow } from "@core/application/services/drill-down-comparison-window";

describe("drillDownComparisonWindow", () => {
	it("keeps the selected range length when shifted by a week", () => {
		expect(drillDownComparisonWindow("2026-10-08", 28, "week")).toMatchObject({
			start: "2026-09-03",
			end: "2026-09-30",
		});
	});
	it("shifts the ending day by a calendar month", () => {
		expect(drillDownComparisonWindow("2026-10-08", 28, "month")).toMatchObject({
			start: "2026-08-11",
			end: "2026-09-07",
		});
	});
	it("clamps month ends and leap days instead of overflowing", () => {
		expect(drillDownComparisonWindow("2026-04-01", 7, "month")).toMatchObject({
			start: "2026-02-22",
			end: "2026-02-28",
		});
		expect(drillDownComparisonWindow("2024-03-01", 7, "year")).toMatchObject({
			start: "2023-02-22",
			end: "2023-02-28",
		});
	});
	it("preserves a full year window and supports the legacy adjacent period", () => {
		expect(drillDownComparisonWindow("2026-10-08", 365, "year")).toMatchObject({
			start: "2024-10-08",
			end: "2025-10-07",
		});
		expect(drillDownComparisonWindow("2026-10-08", 28, "previous-period")).toMatchObject({
			start: "2026-08-13",
			end: "2026-09-09",
		});
	});
});
