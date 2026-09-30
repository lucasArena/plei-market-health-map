import type {
	DailyActivity,
	DailyActivityIncrement,
} from "@core/application/dtos/app-metrics-dto.types";

export interface DailyActivityRepository {
	record(increment: DailyActivityIncrement): Promise<void>;
	listBetween(fromDay: string, toDay: string): Promise<DailyActivity[]>;
	deleteBefore(day: string): Promise<void>;
}
