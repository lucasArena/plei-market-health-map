import {
	APP_METRICS_GOAL_PERCENT,
	APP_METRICS_WEEKS,
} from "@core/application/dtos/app-metrics-dto";
import type { AppMetricsView } from "@core/application/dtos/app-metrics-dto.types";
import { activeEmails, normalizeEmail } from "@core/application/mappers/app-metrics-mapper";
import type { AppMetricsDeps } from "@core/application/services/get-app-metrics.types";
import { addDays, easternDay, weekStartOf } from "@core/domain";

function percentOf(part: number, total: number): number {
	return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

export function makeGetAppMetrics({ dailyActivity, clock, targetEmails }: AppMetricsDeps) {
	const targets = [...new Set(targetEmails.map(normalizeEmail))];

	return async function getAppMetrics(): Promise<AppMetricsView> {
		const today = easternDay(clock.now());
		const weekStart = weekStartOf(today);
		const firstWeek = addDays(weekStart, -7 * (APP_METRICS_WEEKS - 1));
		const rows = await dailyActivity.listBetween(firstWeek, today);
		const weeks = Array.from({ length: APP_METRICS_WEEKS }, (_, index) => {
			const start = addDays(firstWeek, index * 7);
			const end = addDays(start, 6);
			const active = activeEmails(rows.filter((row) => row.day >= start && row.day <= end));
			const activeTargetCount = targets.filter((email) => active.has(email)).length;
			return {
				weekStart: start,
				activeTargetCount,
				targetPercent: percentOf(activeTargetCount, targets.length),
				activeUserCount: active.size,
				active,
			};
		});
		const current = weeks.at(-1);
		const active = current?.active ?? new Set<string>();
		const targetPercent = current?.targetPercent ?? 0;
		return {
			weekStart,
			weekEnd: addDays(weekStart, 6),
			goalPercent: APP_METRICS_GOAL_PERCENT,
			targetCount: targets.length,
			activeTargetCount: current?.activeTargetCount ?? 0,
			targetPercent,
			isGoalMet: targets.length > 0 && targetPercent >= APP_METRICS_GOAL_PERCENT,
			activeUserCount: current?.activeUserCount ?? 0,
			inactiveTargets: targets.filter((email) => !active.has(email)),
			weeks: weeks.map(({ active: _active, ...week }) => week),
		};
	};
}
