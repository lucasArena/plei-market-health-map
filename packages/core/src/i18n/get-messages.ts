import { DEFAULT_LOCALE, isLocale } from "@core/i18n/locales";
import type { Locale } from "@core/i18n/locales.types";
import { en } from "@core/i18n/messages/en";
import type { Messages } from "@core/i18n/messages/messages.types";
import { ptBR } from "@core/i18n/messages/pt-BR";

const CATALOGS: Record<Locale, Messages> = { en, "pt-BR": ptBR };
const CATALOG_BY_LANGUAGE: Record<string, Locale> = { en: "en", pt: "pt-BR" };

export function getMessages(locale: Locale): Messages {
	return CATALOGS[locale];
}

export function parseAcceptLanguage(header: string | null): Locale {
	if (!header) return DEFAULT_LOCALE;
	for (const part of header.split(",")) {
		const tag = part.split(";", 1).join("").trim();
		if (isLocale(tag)) return tag;
		const regional = CATALOG_BY_LANGUAGE[tag.toLowerCase().split("-", 1).join("")];
		if (regional) return regional;
	}
	return DEFAULT_LOCALE;
}
