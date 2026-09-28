import { getMessages } from "@market-health-map/i18n";
import { getRequestLocale } from "@/server/i18n/get-request-locale";

export default async function OfflinePage() {
	const { offline } = getMessages(await getRequestLocale());
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background p-4 text-center">
			<h1 className="text-2xl font-semibold">{offline.title}</h1>
			<p className="text-muted-foreground">{offline.description}</p>
		</div>
	);
}
