"use client";

import { QueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSystemTheme } from "@/presentation/hooks/use-theme/use-system-theme";

const STALE_TIME_MS = 30_000;

export function useAppProvidersRules() {
	const isDark = useSystemTheme();
	useEffect(() => {
		document.documentElement.classList.toggle("dark", isDark);
	}, [isDark]);
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { staleTime: STALE_TIME_MS } } }),
	);
	return { queryClient };
}
