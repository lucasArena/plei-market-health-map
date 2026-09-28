export interface Messages {
	common: {
		appName: string;
		appDescription: string;
	};
	map: {
		title: string;
		loading: string;
		failed: string;
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
