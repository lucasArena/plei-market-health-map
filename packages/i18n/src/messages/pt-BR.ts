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
	facilityAi: {
		generate: "Gerar resumo com IA",
		downloadHint:
			"Baixa uma única vez um modelo gratuito de 880 MB, que depois roda de forma privada neste dispositivo.",
		loading: "Carregando o modelo de IA neste dispositivo… {percent}%",
		writing: "Escrevendo resumo…",
		label: "Resumo por IA",
		failed: "O resumo por IA não está disponível neste dispositivo, então este é o resumo padrão.",
	},
	facilityDetail: {
		label: "Detalhes da instalação",
		close: "Fechar detalhes da instalação",
		failed: "Não foi possível carregar esta instalação.",
		gamesOne: "{count} jogo",
		gamesOther: "{count} jogos",
		summaryNone: "Nenhum jogo foi realizado aqui nos últimos 28 dias.",
		summaryPlayed: "{games} realizados nos últimos 28 dias ({start} – {end}).",
		playedLastWeek: "Realizados na semana passada",
		scheduled: "Agendados",
		cancelled: "Cancelados",
		nextSevenDays: "Próximos 7 dias",
		vsPreviousWeek: "{change} vs semana anterior",
		cancellationRate: "{rate}% dos agendados",
		weekRange: "Semana de {start} – {end}",
		lastPlayed: "Último jogo em {date}",
		neverPlayed: "Nenhum jogo realizado ainda",
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
