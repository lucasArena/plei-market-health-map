import type { Messages } from "@market-health-map/core/i18n";

export type FeatureFlagsMessages = Messages["featureFlags"];

export type FeatureFlagsStatus = "loading" | "error" | "ready";

export interface FeatureFlagRow {
	key: string;
	description: string;
	enabled: boolean;
	state: "on" | "off";
	statusLabel: string;
	/** Explains which flag this one needs on, when it needs one. */
	requirement: string | null;
	toggleLabel: string;
	lastChange: string;
}
