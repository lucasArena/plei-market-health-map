import type { Messages } from "@i18n/messages/messages.types";

export const en: Messages = {
	common: {
		appName: "Market Health Map",
		appDescription: "A shared view of Plei market health for internal teams.",
	},
	map: {
		title: "Facilities map",
		loading: "Loading facilities…",
		failed: "Could not load facilities.",
	},
	facility: {
		close: "Close facility details",
		details: "Facility details",
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
