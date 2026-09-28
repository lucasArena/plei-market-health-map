import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MessagesProvider } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import { EN_MESSAGES } from "@/test/messages";

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
