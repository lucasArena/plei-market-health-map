import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MessagesProvider } from "@/presentation/components/i18n/MessagesProvider/MessagesProviderComponent";

export function renderWithMessages(ui: ReactElement, options?: RenderOptions) {
	function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
		return (
			<MessagesProvider locale="en" messages={EN_MESSAGES}>
				{children}
			</MessagesProvider>
		);
	}
	return render(ui, { wrapper: Wrapper, ...options });
}
