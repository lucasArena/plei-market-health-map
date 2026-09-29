"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MessagesProvider } from "@/presentation/components/i18n/MessagesProvider/MessagesProviderComponent";
import type { AppProvidersProps } from "@/presentation/components/providers/AppProviders/AppProvidersComponent.types";

const STALE_TIME_MS = 30_000;

export function AppProviders({ locale, messages, children }: Readonly<AppProvidersProps>) {
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { staleTime: STALE_TIME_MS } } }),
	);
	return (
		<QueryClientProvider client={queryClient}>
			<MessagesProvider locale={locale} messages={messages}>
				{children}
			</MessagesProvider>
		</QueryClientProvider>
	);
}
