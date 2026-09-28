import { DEFAULT_LOCALE, isLocale } from "@i18n/locales";
import type { Locale } from "@i18n/locales.types";
import { en } from "@i18n/messages/en";
import type { Messages } from "@i18n/messages/messages.types";
import { ptBR } from "@i18n/messages/pt-BR";

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
