import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function renderWithMessages(ui: ReactElement, options?: RenderOptions) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
		return (
			<QueryClientProvider client={queryClient}>
				<MessagesProvider locale="en" messages={EN_MESSAGES}>
					{children}
				</MessagesProvider>
			</QueryClientProvider>
		);
	}
	return render(ui, { wrapper: Wrapper, ...options });
}
