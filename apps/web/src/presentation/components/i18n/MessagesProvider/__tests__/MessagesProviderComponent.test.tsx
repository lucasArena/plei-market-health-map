import { renderHook } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	MessagesProvider,
	useMessages,
} from "@/presentation/components/i18n/MessagesProvider/MessagesProviderComponent";

describe("MessagesProvider", () => {
	it("exposes the locale and catalog", () => {
		const { result } = renderHook(() => useMessages(), {
			wrapper: ({ children }) => (
				<MessagesProvider locale="en" messages={EN_MESSAGES}>
					{children}
				</MessagesProvider>
			),
		});

		expect(result.current).toEqual({ locale: "en", messages: EN_MESSAGES });
	});

	it("throws outside the provider", () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		expect(() => renderHook(() => useMessages())).toThrow("within MessagesProvider");
	});
});
