import type { Messages } from "@market-health-map/core/i18n";

export type FeatureFlagsMessages = Messages["featureFlags"];

export type FeatureFlagsStatus = "loading" | "error" | "ready";

export interface FeatureFlagRow {
	key: string;
	description: string;
	enabled: boolean;
	state: "on" | "off";
	statusLabel: string;
	toggleLabel: string;
	lastChange: string;
}
