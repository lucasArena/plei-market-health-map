"use client";

import type { LoginEventView } from "@market-health-map/application";
import { useMemo } from "react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import type {
	RecentLoginRow,
	RecentLoginsProps,
	RecentLoginsStatus,
} from "@/components/logins/RecentLogins/RecentLoginsComponent.types";
import { useRecentLogins } from "@/lib/api/use-recent-logins";

export const DEFAULT_LIMIT = 10;

export function toRecentLoginRows(logins: LoginEventView[], locale: string): RecentLoginRow[] {
	const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
	return logins.map((login) => ({
		...login,
		signedInLabel: formatter.format(new Date(login.signedInAt)),
	}));
}

export function resolveStatus(
	isPending: boolean,
	isError: boolean,
	count: number,
): RecentLoginsStatus {
	const status = {
		[`${count > 0}`]: "ready",
		[`${count === 0}`]: "empty",
		[`${isError}`]: "error",
		[`${isPending}`]: "loading",
	}.true;
	return status as RecentLoginsStatus;
}

export function useRecentLoginsRules({ limit = DEFAULT_LIMIT }: RecentLoginsProps) {
	const { locale, messages } = useMessages();
	const query = useRecentLogins(limit);

	const rows = useMemo(() => toRecentLoginRows(query.data ?? [], locale), [query.data, locale]);
	const status = resolveStatus(query.isPending, query.isError, rows.length);

	return { messages: messages.logins, rows, status };
}
