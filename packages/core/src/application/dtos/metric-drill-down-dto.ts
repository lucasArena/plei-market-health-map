import { statsTimeZoneSchema } from "@core/application/dtos/facility-detail-dto";
import { gameDepartmentsSchema } from "@core/application/dtos/market-summary-dto";
import {
	DRILL_DOWN_GRAINS,
	DRILL_DOWN_MEASURES,
	DRILL_DOWN_RANGES,
	DRILL_DOWN_SEGMENTS,
	DRILL_DOWN_SLICES,
	type DrillDownMeasure,
} from "@core/application/dtos/metric-drill-down-dto.types";
import { GAME_DEPARTMENTS } from "@core/domain";
import { z } from "zod";

export {
	DRILL_DOWN_GRAINS,
	DRILL_DOWN_MEASURE_KIND,
	DRILL_DOWN_MEASURE_KINDS,
	DRILL_DOWN_MEASURES,
	DRILL_DOWN_RANGE_DAYS,
	DRILL_DOWN_RANGES,
	DRILL_DOWN_SEGMENTS,
	DRILL_DOWN_SLICES,
} from "@core/application/dtos/metric-drill-down-dto.types";

export const getMetricDrillDownSchema = z
	.object({
		measure: z.enum(DRILL_DOWN_MEASURES),
		range: z.enum(DRILL_DOWN_RANGES),
		slice: z.enum(DRILL_DOWN_SLICES),
		segment: z.enum(DRILL_DOWN_SEGMENTS).optional(),
		marketId: z.string().trim().min(1).max(64).optional(),
		facilityId: z.string().trim().min(1).max(64).optional(),
		department: z.enum(GAME_DEPARTMENTS).optional(),
		departments: gameDepartmentsSchema,
		timeZone: statsTimeZoneSchema,
		grain: z.enum(DRILL_DOWN_GRAINS).default("range"),
	})
	.superRefine((value, context) => {
		if (value.slice === "time" && value.grain === "range") {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["grain"],
				message: "Time requires a calendar grain.",
			});
		}
		if (value.slice !== "time" && value.grain !== "range") {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["grain"],
				message: "Calendar grains require Time.",
			});
		}
		if (value.measure === "active-facilities" && value.slice === "department") {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["slice"],
				message: "Active facilities cannot be sliced by department.",
			});
		}
	});

export function canSliceDrillDownByDepartment(measure: DrillDownMeasure): boolean {
	return measure !== "active-facilities" && !isAppActivityMeasure(measure);
}

export function canSegmentDrillDown(
	measure: DrillDownMeasure,
	slice: (typeof DRILL_DOWN_SLICES)[number],
): boolean {
	return canSliceDrillDownByDepartment(measure) && slice !== "department";
}

export function isAppActivityMeasure(measure: DrillDownMeasure): boolean {
	return ["app-sessions", "registrations", "unique-users"].includes(measure);
}

export function crossesAppTrackingSourceSwitch(start: string, end: string): boolean {
	return start <= "2026-06-29" && end > "2026-06-29";
}
