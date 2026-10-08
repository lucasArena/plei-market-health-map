"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useAppProvidersRules } from "@/presentation/components/providers/AppProviders/AppProvidersComponent.rules";
import type { AppProvidersProps } from "@/presentation/components/providers/AppProviders/AppProvidersComponent.types";
import { HeaderSlotProvider } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import { MapScopeProvider } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { SidePanelProvider } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";

export function AppProviders({ locale, messages, children }: Readonly<AppProvidersProps>) {
	const { queryClient } = useAppProvidersRules();
	return (
		<QueryClientProvider client={queryClient}>
			<MessagesProvider locale={locale} messages={messages}>
				<MapScopeProvider>
					<SidePanelProvider>
						<HeaderSlotProvider>{children}</HeaderSlotProvider>
					</SidePanelProvider>
				</MapScopeProvider>
			</MessagesProvider>
		</QueryClientProvider>
	);
}
