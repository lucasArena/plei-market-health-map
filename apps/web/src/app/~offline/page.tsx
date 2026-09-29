import { getMessages } from "@market-health-map/core/i18n";
import { getRequestLocale } from "@/infrastructure/i18n/get-request-locale";
import { OfflineScreen } from "@/presentation/screens/OfflineScreen/OfflineScreenComponent";

export default async function OfflinePage() {
	const { offline } = getMessages(await getRequestLocale());
	return <OfflineScreen title={offline.title} description={offline.description} />;
}
