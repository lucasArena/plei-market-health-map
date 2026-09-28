import { renderHook } from "@testing-library/react";
import {
	MessagesProvider,
	useMessages,
} from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import { EN_MESSAGES } from "@/test/messages";

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
