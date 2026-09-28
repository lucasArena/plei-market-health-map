import type { MarketHealthStatus } from "@market-health-map/domain";

export const HEALTH_STATUS_COLORS: Record<MarketHealthStatus, string> = {
	healthy: "#047857",
	watch: "#d97706",
	"at-risk": "#dc2626",
	inactive: "#9ca3af",
};
