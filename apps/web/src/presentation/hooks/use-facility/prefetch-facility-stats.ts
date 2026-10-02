import type { QueryClient } from "@tanstack/react-query";
import { facilityPlayerStatsQueryOptions } from "@/presentation/hooks/use-facility/use-facility-player-stats";
import { facilityReservationStatsQueryOptions } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";

export async function prefetchFacilityStats(
	queryClient: QueryClient,
	facilityId: string,
): Promise<void> {
	await Promise.all([
		queryClient.prefetchQuery(facilityReservationStatsQueryOptions(facilityId)),
		queryClient.prefetchQuery(facilityPlayerStatsQueryOptions(facilityId)),
	]);
}
