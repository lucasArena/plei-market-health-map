"use client";

import { createContext, useContext } from "react";
import { useMessagesProviderRules } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent.rules";
import type {
	MessagesContextValue,
	MessagesProviderProps,
} from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent.types";

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export function MessagesProvider({ locale, messages, children }: Readonly<MessagesProviderProps>) {
	const value = useMessagesProviderRules(locale, messages);
	return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages(): MessagesContextValue {
	const context = useContext(MessagesContext);
	if (!context) throw new Error("useMessages must be used within MessagesProvider");
	return context;
}
