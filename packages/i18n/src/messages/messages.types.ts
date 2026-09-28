export interface Messages {
	common: {
		appName: string;
		appDescription: string;
	};
	auth: {
		subtitle: string;
		continueWithGoogle: string;
		redirecting: string;
		domainError: string;
		missingEmailError: string;
		genericError: string;
		accountMenu: string;
		version: string;
		signOut: string;
	};
	map: {
		title: string;
		loading: string;
		failed: string;
		clusterCount: string;
		moreFacilities: string;
	};
	facility: {
		close: string;
		details: string;
	};
	offline: {
		title: string;
		description: string;
	};
	errors: {
		unauthorized: string;
		forbidden: string;
		notFound: string;
		invalidRequest: string;
		internal: string;
	};
}
