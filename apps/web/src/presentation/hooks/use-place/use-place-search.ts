"use client";

import { MIN_PLACE_QUERY_LENGTH, type PlaceView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

const PLACE_STALE_MS = 60 * 60 * 1000;

export function placeSearchPath(query: string): string {
	return `/api/v1/places?${new URLSearchParams({ q: query })}`;
}

export function usePlaceSearch(query: string) {
	const normalized = query.trim().toLocaleLowerCase();
	return useQuery({
		queryKey: ["places", normalized],
		queryFn: () => apiClient.get<PlaceView[]>(placeSearchPath(normalized)),
		enabled: normalized.length >= MIN_PLACE_QUERY_LENGTH,
		staleTime: PLACE_STALE_MS,
		retry: false,
	});
}
