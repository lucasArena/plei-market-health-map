import { enUS, ptBR } from "@clerk/localizations";
import type { Locale } from "@market-health-map/i18n";

const CLERK_LOCALIZATIONS = { en: enUS, "pt-BR": ptBR } satisfies Record<Locale, unknown>;

export function getClerkLocalization(locale: Locale) {
	return CLERK_LOCALIZATIONS[locale];
}
