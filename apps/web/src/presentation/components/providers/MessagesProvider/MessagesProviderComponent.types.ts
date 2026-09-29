import type { Locale, Messages } from "@market-health-map/core/i18n";
import type { ReactNode } from "react";

export interface MessagesContextValue {
	locale: Locale;
	messages: Messages;
}

export interface MessagesProviderProps extends MessagesContextValue {
	children: ReactNode;
}
