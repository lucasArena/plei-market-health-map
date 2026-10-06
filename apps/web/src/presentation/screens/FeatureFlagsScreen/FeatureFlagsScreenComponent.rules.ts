"use client";

import type { FeatureFlagView } from "@market-health-map/core/application";
import { GAMES_WINDOW_DAYS } from "@market-health-map/core/domain";
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

function statusLabel(
	flag: FeatureFlagView,
	enabledKeys: ReadonlySet<string>,
	messages: FeatureFlagsMessages,
): string {
	if (!flag.enabled) return messages.off;
	if (flag.requires && !enabledKeys.has(flag.requires)) {
		return formatMessage(messages.waiting, { flag: flag.requires });
	}
	return messages.on;
}

export function buildFeatureFlagRows(
	flags: FeatureFlagView[],
	messages: FeatureFlagsMessages,
	formatters: DetailFormatters,
): FeatureFlagRow[] {
	const enabledKeys = new Set(flags.filter((flag) => flag.enabled).map((flag) => flag.key));
	return flags.map((flag) => ({
		key: flag.key,
		description: formatMessage(messages.descriptions[flag.key] ?? "", { days: GAMES_WINDOW_DAYS }),
		enabled: flag.enabled,
		state: flag.enabled ? "on" : "off",
		statusLabel: statusLabel(flag, enabledKeys, messages),
		requirement: flag.requires ? formatMessage(messages.requires, { flag: flag.requires }) : null,
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
