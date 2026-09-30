import {
	APP_METRICS_WEEKS,
	listAppMetricsPeopleSchema,
} from "@core/application/dtos/app-metrics-dto";
import type {
	AppMetricsPeoplePage,
	ListAppMetricsPeopleInput,
} from "@core/application/dtos/app-metrics-dto.types";
import { comparePeople, toPeopleViews } from "@core/application/mappers/app-metrics-mapper";
import type { AppMetricsDeps } from "@core/application/services/get-app-metrics.types";
import { addDays, easternDay, weekStartOf } from "@core/domain";

export function makeListAppMetricsPeople({ dailyActivity, clock, targetEmails }: AppMetricsDeps) {
	return async function listAppMetricsPeople(
		input: ListAppMetricsPeopleInput = {},
	): Promise<AppMetricsPeoplePage> {
		const { page, pageSize } = listAppMetricsPeopleSchema.parse(input);
		const today = easternDay(clock.now());
		const weekStart = weekStartOf(today);
		const history = await dailyActivity.listBetween(
			addDays(weekStart, -7 * (APP_METRICS_WEEKS - 1)),
			today,
		);
		const people = toPeopleViews(
			history.filter((row) => row.day >= weekStart),
			history,
			targetEmails,
		).sort(comparePeople);
		const pageCount = Math.max(1, Math.ceil(people.length / pageSize));
		return {
			rows: people.slice((page - 1) * pageSize, page * pageSize),
			page,
			pageSize,
			total: people.length,
			pageCount,
		};
	};
}
