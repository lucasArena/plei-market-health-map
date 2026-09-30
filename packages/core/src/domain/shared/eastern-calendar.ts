const DAY_MS = 86_400_000;
const EASTERN_TIME_ZONE = "America/New_York";

const easternDayFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: EASTERN_TIME_ZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

export function easternDay(date: Date): string {
	return easternDayFormatter.format(date);
}

export function addDays(day: string, days: number): string {
	return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
