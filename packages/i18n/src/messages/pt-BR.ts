import type { Messages } from "@i18n/messages/messages.types";

export const ptBR: Messages = {
	common: {
		appName: "Mapa de Saúde de Mercado",
		appDescription:
			"Uma visão compartilhada da saúde dos mercados da Plei para as equipes internas.",
	},
	map: {
		title: "Mapa de instalações",
		loading: "Carregando instalações…",
		failed: "Não foi possível carregar as instalações.",
	},
	facility: {
		close: "Fechar detalhes da instalação",
		details: "Detalhes da instalação",
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
