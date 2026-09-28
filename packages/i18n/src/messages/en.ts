import type { Messages } from "@i18n/messages/messages.types";

export const en: Messages = {
	common: {
		appName: "Market Health Map",
		appDescription: "A shared view of Plei market health for internal teams.",
	},
	nav: {
		map: "Map",
		adoption: "Adoption",
	},
	logins: {
		title: "Recent sign-ins",
		description: "Internal team members who opened the Market Health Map.",
		loading: "Loading sign-ins…",
		empty: "No sign-ins recorded yet.",
		failed: "Could not load sign-ins.",
	},
	map: {
		title: "Market health",
		legendLabel: "Map legend",
		sampleNotice: "Sample data: live market metrics are not connected yet.",
		loading: "Loading markets…",
		failed: "Could not load markets.",
		metricLabel: "Heat metric",
		metrics: {
			healthScore: "Health score",
			activePlayers: "Active players",
			gamesLastWeek: "Games last week",
			facilities: "Facilities",
		},
		statuses: {
			healthy: "Healthy",
			watch: "Watch",
			atRisk: "At risk",
			inactive: "No facilities",
		},
	},
	marketDetail: {
		close: "Close market details",
		indicators: "Indicators",
		facilities: "Facilities",
		facilitiesCount: "{count} facilities",
		empty: "No facilities in this market yet.",
		failed: "Could not load this market.",
		players: "players",
		games: "games/wk",
		utilization: "utilization",
	},
	offline: {
		title: "You are offline",
		description: "Reconnect to the internet to keep exploring market health.",
	},
	errors: {
		unauthorized: "You need to sign in to continue.",
		forbidden: "You do not have access to this resource.",
		notFound: "The requested resource was not found.",
		invalidRequest: "The request is invalid.",
		internal: "Something went wrong. Please try again.",
	},
};
