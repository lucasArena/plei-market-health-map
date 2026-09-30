import type {
	DailyActivity,
	DailyActivityIncrement,
} from "@core/application/dtos/app-metrics-dto.types";
import type { DailyActivityRepository } from "@core/application/repositories/daily-activity-repository.types";

export class InMemoryDailyActivityRepository implements DailyActivityRepository {
	readonly rows = new Map<string, DailyActivity>();

	constructor(seed: DailyActivity[] = []) {
		for (const row of seed) this.rows.set(`${row.userId}:${row.day}`, row);
	}

	async record(increment: DailyActivityIncrement): Promise<void> {
		const key = `${increment.userId}:${increment.day}`;
		const current = this.rows.get(key);
		if (!current) {
			this.rows.set(key, {
				userId: increment.userId,
				email: increment.email,
				name: increment.name,
				day: increment.day,
				firstSeenAt: increment.at,
				lastSeenAt: increment.at,
				minutesActive: increment.minutes,
				visits: increment.visits,
				counters: { ...increment.counters },
			});
			return;
		}
		const counters = { ...current.counters };
		for (const [counter, value] of Object.entries(increment.counters)) {
			counters[counter as keyof typeof counters] += value;
		}
		this.rows.set(key, {
			...current,
			email: increment.email,
			name: increment.name ?? current.name,
			lastSeenAt: increment.at,
			minutesActive: current.minutesActive + increment.minutes,
			visits: current.visits + increment.visits,
			counters,
		});
	}

	async listBetween(fromDay: string, toDay: string): Promise<DailyActivity[]> {
		return [...this.rows.values()].filter((row) => row.day >= fromDay && row.day <= toDay);
	}

	async deleteBefore(day: string): Promise<void> {
		for (const [key, row] of this.rows) if (row.day < day) this.rows.delete(key);
	}
}
