const DAY_MS = 86_400_000;

function toIsoDate(time: number): string {
	return new Date(time).toISOString().slice(0, 10);
}

function utcMidnight(isoDate: string): number {
	return Date.parse(`${isoDate}T00:00:00Z`);
}

export function weekStartOf(isoDate: string): string {
	const time = utcMidnight(isoDate);
	const daysSinceMonday = (new Date(time).getUTCDay() + 6) % 7;
	return toIsoDate(time - daysSinceMonday * DAY_MS);
}

export function weekEndOf(weekStart: string): string {
	return toIsoDate(utcMidnight(weekStart) + 6 * DAY_MS);
}

export function lastCompletedWeekStart(now: Date): string {
	const currentWeekStart = weekStartOf(now.toISOString().slice(0, 10));
	return toIsoDate(utcMidnight(currentWeekStart) - 7 * DAY_MS);
}
