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
		sessionHeatmapLegend: string;
		sessionHeatmapContext: string;
		sessionHeatmapNoActivity: string;
		sessionHeatmapLowValue: string;
		sessionHeatmapHighValue: string;
	};
	facilityAi: {
		generate: string;
		downloadHint: string;
		loading: string;
		writing: string;
		label: string;
		failed: string;
	};
	facilityDetail: {
		label: string;
		close: string;
		failed: string;
		gamesOne: string;
		gamesOther: string;
		summaryNone: string;
		summaryPlayed: string;
		playedLastWeek: string;
		scheduled: string;
		cancelled: string;
		nextSevenDays: string;
		vsPreviousWeek: string;
		cancellationRate: string;
		weekRange: string;
		lastPlayed: string;
		neverPlayed: string;
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
