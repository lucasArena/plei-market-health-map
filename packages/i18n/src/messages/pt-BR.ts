import type { Messages } from "@i18n/messages/messages.types";

export const ptBR: Messages = {
	common: {
		appName: "Mapa de Saúde de Mercado",
		appDescription:
			"Uma visão compartilhada da saúde dos mercados da Plei para as equipes internas.",
	},
	nav: {
		map: "Mapa",
		adoption: "Adoção",
	},
	logins: {
		title: "Acessos recentes",
		description: "Membros da equipe interna que abriram o Mapa de Saúde de Mercado.",
		loading: "Carregando acessos…",
		empty: "Nenhum acesso registrado ainda.",
		failed: "Não foi possível carregar os acessos.",
	},
	map: {
		title: "Saúde dos mercados",
		legendLabel: "Legenda do mapa",
		sampleNotice: "Dados de exemplo: as métricas reais dos mercados ainda não estão conectadas.",
		loading: "Carregando mercados…",
		failed: "Não foi possível carregar os mercados.",
		metricLabel: "Métrica do mapa de calor",
		metrics: {
			healthScore: "Índice de saúde",
			activePlayers: "Jogadores ativos",
			gamesLastWeek: "Jogos na última semana",
			facilities: "Instalações",
		},
		statuses: {
			healthy: "Saudável",
			watch: "Atenção",
			atRisk: "Em risco",
			inactive: "Sem instalações",
		},
	},
	marketDetail: {
		close: "Fechar detalhes do mercado",
		indicators: "Indicadores",
		facilities: "Instalações",
		facilitiesCount: "{count} instalações",
		empty: "Nenhuma instalação neste mercado ainda.",
		failed: "Não foi possível carregar este mercado.",
		players: "jogadores",
		games: "jogos/sem",
		utilization: "ocupação",
	},
	offline: {
		title: "Você está offline",
		description: "Reconecte-se à internet para continuar explorando a saúde dos mercados.",
	},
	errors: {
		unauthorized: "Você precisa entrar para continuar.",
		forbidden: "Você não tem acesso a este recurso.",
		notFound: "O recurso solicitado não foi encontrado.",
		invalidRequest: "A requisição é inválida.",
		internal: "Algo deu errado. Tente novamente.",
	},
};
