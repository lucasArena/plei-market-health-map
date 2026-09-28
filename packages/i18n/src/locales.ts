import type { Locale } from "@i18n/locales.types";

export const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
