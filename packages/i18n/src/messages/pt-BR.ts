import type { Messages } from "@i18n/messages/messages.types";

export const ptBR: Messages = {
	common: {
		appName: "Mapa de Saúde de Mercado",
		appDescription:
			"Uma visão compartilhada da saúde dos mercados da Plei para as equipes internas.",
	},
	auth: {
		subtitle: "Entre com sua conta Google da Plei.",
		continueWithGoogle: "Continuar com Google",
		redirecting: "Redirecionando…",
		domainError: "{email} não é uma conta Plei. Apenas contas Google @{domain} podem entrar.",
		missingEmailError:
			"Sua conta Google não compartilhou um e-mail, então não conseguimos verificá-la.",
		genericError: "Não foi possível entrar. Tente novamente.",
		accountMenu: "Menu da conta",
		version: "Versão {version}",
		signOut: "Sair",
	},
	map: {
		title: "Mapa de instalações",
		loading: "Carregando instalações…",
		failed: "Não foi possível carregar as instalações.",
		clusterCount: "{count} instalações",
		moreFacilities: "+{count} outras",
		sessionHeatmapLegend: "Sessões por área sombreada · últimos 28 dias",
		sessionHeatmapContext: "A escala é atualizada para a visualização atual do mapa",
		sessionHeatmapNoActivity: "Nenhuma sessão na visualização atual do mapa",
		sessionHeatmapLowValue: "{count} sessões em uma área sombreada",
		sessionHeatmapHighValue: "{count}+ sessões em uma área sombreada",
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
