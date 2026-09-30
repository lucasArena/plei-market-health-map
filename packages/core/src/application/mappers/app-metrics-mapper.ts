import { ACTIVITY_COUNTERS } from "@core/application/dtos/app-metrics-dto";
import type {
	ActivityCounter,
	ActivityCounters,
	AppMetricsPersonView,
	DailyActivity,
} from "@core/application/dtos/app-metrics-dto.types";

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function emptyCounters(): ActivityCounters {
	return {
		facilitiesOpened: 0,
		marketSummariesOpened: 0,
		searches: 0,
		aiSummaries: 0,
		feedbackSent: 0,
	};
}

export function topFeatureOf(counters: ActivityCounters): ActivityCounter | null {
	const [top] = [...ACTIVITY_COUNTERS]
		.filter((counter) => counters[counter] > 0)
		.sort((a, b) => counters[b] - counters[a]);
	return top ?? null;
}

export function activeEmails(rows: DailyActivity[]): Set<string> {
	return new Set(rows.map((row) => normalizeEmail(row.email)));
}

export function toPeopleViews(
	weekRows: DailyActivity[],
	historyRows: DailyActivity[],
	targetEmails: string[],
): AppMetricsPersonView[] {
	const targets = new Set(targetEmails.map(normalizeEmail));
	const people = new Map<string, AppMetricsPersonView & { counters: ActivityCounters }>();
	const personFor = (email: string, name: string | null) => {
		const key = normalizeEmail(email);
		const existing = people.get(key);
		if (existing) {
			existing.name ??= name;
			return existing;
		}
		const created = {
			email: key,
			name,
			isTarget: targets.has(key),
			daysActive: 0,
			visits: 0,
			minutes: 0,
			topFeature: null,
			lastSeenAt: null,
			counters: emptyCounters(),
		};
		people.set(key, created);
		return created;
	};
	for (const target of targets) personFor(target, null);
	for (const row of historyRows) {
		const person = personFor(row.email, row.name);
		const seenAt = row.lastSeenAt.toISOString();
		if (!person.lastSeenAt || seenAt > person.lastSeenAt) person.lastSeenAt = seenAt;
	}
	for (const row of weekRows) {
		const person = personFor(row.email, row.name);
		person.daysActive += 1;
		person.visits += row.visits;
		person.minutes += row.minutesActive;
		for (const counter of ACTIVITY_COUNTERS) person.counters[counter] += row.counters[counter];
	}
	return [...people.values()].map(({ counters, ...person }) => ({
		...person,
		topFeature: topFeatureOf(counters),
	}));
}

export function comparePeople(a: AppMetricsPersonView, b: AppMetricsPersonView): number {
	if (a.isTarget !== b.isTarget) return a.isTarget ? -1 : 1;
	if (a.lastSeenAt !== b.lastSeenAt) return (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? "");
	return a.email.localeCompare(b.email);
}
