import type { QueryClient } from "@tanstack/react-query";
import { facilityReservationStatsQueryOptions } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";

export function prefetchFacilityReservationStats(
	queryClient: QueryClient,
	facilityId: string,
): Promise<void> {
	return queryClient.prefetchQuery(facilityReservationStatsQueryOptions(facilityId));
}
