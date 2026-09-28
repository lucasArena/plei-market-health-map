export const CLERK_CONFIG = {
	logoUrl: "/images/plei-logo.svg",
	termsUrl: "https://www.plei.com/terms/terms-conditions",
} as const;

export const CLERK_APPEARANCE = {
	layout: {
		logoImageUrl: CLERK_CONFIG.logoUrl,
		termsPageUrl: CLERK_CONFIG.termsUrl,
	},
	variables: {
		colorPrimary: "#047857",
		colorText: "oklch(0.145 0 0)",
		colorTextSecondary: "oklch(0.556 0 0)",
		colorBackground: "oklch(1 0 0)",
		colorInputBackground: "oklch(1 0 0)",
		colorInputText: "oklch(0.145 0 0)",
		borderRadius: "0.5rem",
	},
};

export const CLERK_SIGN_IN_APPEARANCE = {
	...CLERK_APPEARANCE,
	elements: {
		formFieldAction: { display: "none" },
	},
};
