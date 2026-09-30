"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { AppProvidersProps } from "@/presentation/components/providers/AppProviders/AppProvidersComponent.types";
import { MapScopeProvider } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const STALE_TIME_MS = 30_000;

export function AppProviders({ locale, messages, children }: Readonly<AppProvidersProps>) {
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { staleTime: STALE_TIME_MS } } }),
	);
	return (
		<QueryClientProvider client={queryClient}>
			<MessagesProvider locale={locale} messages={messages}>
				<MapScopeProvider>{children}</MapScopeProvider>
			</MessagesProvider>
		</QueryClientProvider>
	);
}
