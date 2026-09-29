import { formatMessage, type Messages } from "@market-health-map/core/i18n";
import type { ClusterHover } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export function clusterLabels(hover: ClusterHover, messages: Messages["map"]) {
	const remaining = hover.total - hover.facilities.length;
	return {
		title: formatMessage(messages.clusterCount, { count: hover.total }),
		more:
			hover.facilities.length > 0 && remaining > 0
				? formatMessage(messages.moreFacilities, { count: remaining })
				: null,
	};
}
