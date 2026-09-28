export interface Messages {
	common: {
		appName: string;
		appDescription: string;
	};
	nav: {
		map: string;
		adoption: string;
	};
	logins: {
		title: string;
		description: string;
		loading: string;
		empty: string;
		failed: string;
	};
	map: {
		title: string;
		legendLabel: string;
		sampleNotice: string;
		loading: string;
		failed: string;
		metricLabel: string;
		metrics: {
			healthScore: string;
			activePlayers: string;
			gamesLastWeek: string;
			facilities: string;
		};
		statuses: {
			healthy: string;
			watch: string;
			atRisk: string;
			inactive: string;
		};
	};
	marketDetail: {
		close: string;
		indicators: string;
		facilities: string;
		facilitiesCount: string;
		empty: string;
		failed: string;
		players: string;
		games: string;
		utilization: string;
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
