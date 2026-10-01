"use client";

import type { FeatureFlagView } from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useMemo, useState } from "react";
import {
	createDetailFormatters,
	resolveDetailStatus,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import type { DetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	useAdminFeatureFlags,
	useSetFeatureFlag,
} from "@/presentation/hooks/use-feature-flags/use-admin-feature-flags";
import type {
	FeatureFlagRow,
	FeatureFlagsMessages,
	FeatureFlagsStatus,
} from "@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent.types";

function lastChangeLabel(
	flag: FeatureFlagView,
	messages: FeatureFlagsMessages,
	formatters: DetailFormatters,
): string {
	if (!flag.updatedAt || !flag.updatedBy) return messages.neverChanged;
	return formatMessage(messages.lastChange, {
		who: flag.updatedBy,
		date: formatters.dayWithYear.format(new Date(flag.updatedAt)),
	});
}

export function buildFeatureFlagRows(
	flags: FeatureFlagView[],
	messages: FeatureFlagsMessages,
	formatters: DetailFormatters,
): FeatureFlagRow[] {
	return flags.map((flag) => ({
		key: flag.key,
		description: messages.descriptions[flag.key] ?? "",
		enabled: flag.enabled,
		state: flag.enabled ? "on" : "off",
		statusLabel: flag.enabled ? messages.on : messages.off,
		toggleLabel: formatMessage(flag.enabled ? messages.turnOff : messages.turnOn, {
			flag: flag.key,
		}),
		lastChange: lastChangeLabel(flag, messages, formatters),
	}));
}

export function useFeatureFlagsScreenRules() {
	const { locale, messages } = useMessages();
	const flagsQuery = useAdminFeatureFlags();
	const setFeatureFlag = useSetFeatureFlag();
	const [failedKey, setFailedKey] = useState<string | null>(null);
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const flagMessages = messages.featureFlags;
	const flags = flagsQuery.data;
	const rows = useMemo(
		() => (flags ? buildFeatureFlagRows(flags, flagMessages, formatters) : []),
		[flagMessages, flags, formatters],
	);
	const status: FeatureFlagsStatus = resolveDetailStatus(flagsQuery.isPending, flagsQuery.isError);

	const toggle = useCallback(
		(row: FeatureFlagRow) => {
			setFailedKey(null);
			setFeatureFlag.mutate(
				{ key: row.key, enabled: !row.enabled },
				{ onError: () => setFailedKey(row.key) },
			);
		},
		[setFeatureFlag],
	);

	return {
		backToMapLabel: messages.appMetrics.backToMap,
		errorMessage: failedKey ? formatMessage(flagMessages.saveFailed, { flag: failedKey }) : null,
		messages: flagMessages,
		pendingKey: setFeatureFlag.isPending ? (setFeatureFlag.variables?.key ?? null) : null,
		rows,
		status,
		toggle,
	};
}
