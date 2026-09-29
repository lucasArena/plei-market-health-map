import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function createQueryWrapper() {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
		return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
	}
	return { client, Wrapper };
}
