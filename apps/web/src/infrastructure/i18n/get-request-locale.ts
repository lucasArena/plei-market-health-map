import { type Locale, parseAcceptLanguage } from "@market-health-map/core/i18n";
import { headers } from "next/headers";

export async function getRequestLocale(): Promise<Locale> {
	const requestHeaders = await headers();
	return parseAcceptLanguage(requestHeaders.get("accept-language"));
}
