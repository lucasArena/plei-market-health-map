"use client";

import type { LoginEventView } from "@market-health-map/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export const recentLoginsQueryKey = (limit: number) => ["logins", "recent", limit] as const;

export function useRecentLogins(limit: number) {
	return useQuery({
		queryKey: recentLoginsQueryKey(limit),
		queryFn: () => apiClient.get<LoginEventView[]>(`/api/v1/logins?limit=${limit}`),
	});
}
