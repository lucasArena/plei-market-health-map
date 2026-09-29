import type { FacilityDetailView } from "@market-health-map/core/application";

export const FACILITY_DETAIL: FacilityDetailView = {
	facility: {
		id: "889",
		marketId: "houston",
		name: "Pegaso HTX",
		avatarUrl: null,
		isActive: true,
		location: { latitude: 29.7, longitude: -95.4 },
		address: "1 Main St, Houston, TX",
	},
	stats: {
		weekStart: "2026-09-21",
		playedLastWeek: 55,
		playedPreviousWeek: 51,
		playedLast28Days: 212,
		scheduledLastWeek: 87,
		cancelledLastWeek: 32,
		upcomingNextSevenDays: 41,
		lastPlayedDate: "2026-09-27",
		playedChangePercent: 7.8,
		cancellationRate: 36.8,
	},
};
