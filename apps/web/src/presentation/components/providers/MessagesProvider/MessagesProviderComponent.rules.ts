"use client";

import type { Locale, Messages } from "@market-health-map/core/i18n";
import { useMemo } from "react";
import type { MessagesContextValue } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent.types";

export function useMessagesProviderRules(locale: Locale, messages: Messages): MessagesContextValue {
	return useMemo(() => ({ locale, messages }), [locale, messages]);
}
