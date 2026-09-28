import type { Messages } from "@i18n/messages/messages.types";

export const en: Messages = {
	common: {
		appName: "Market Health Map",
		appDescription: "A shared view of Plei market health for internal teams.",
	},
	auth: {
		subtitle: "Sign in with your Plei Google account.",
		continueWithGoogle: "Continue with Google",
		redirecting: "Redirecting…",
		domainError: "{email} isn't a Plei account. Only @{domain} Google accounts can sign in.",
		missingEmailError:
			"Your Google account didn't share an email address, so we couldn't check it.",
		genericError: "Sign-in failed. Please try again.",
		accountMenu: "Account menu",
		version: "Version {version}",
		signOut: "Sign out",
	},
	map: {
		title: "Facilities map",
		loading: "Loading facilities…",
		failed: "Could not load facilities.",
		clusterCount: "{count} facilities",
		moreFacilities: "+{count} more",
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
