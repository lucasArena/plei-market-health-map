"use client";

import { QueryClient } from "@tanstack/react-query";
import { useState } from "react";

const STALE_TIME_MS = 30_000;

export function useAppProvidersRules() {
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { staleTime: STALE_TIME_MS } } }),
	);
	return { queryClient };
}
