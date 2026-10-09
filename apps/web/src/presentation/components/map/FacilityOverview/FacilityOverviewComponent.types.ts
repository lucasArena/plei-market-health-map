import type { Messages } from "@market-health-map/core/i18n";
import type { GamesMetricView } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";

export type FacilityViewMessages = Messages["facilityView"];

export interface FacilityOverviewProps {
	facilityId: string;
	facilityName: string;
	marketName: string;
}

export interface FacilityMetricsSectionView {
	title: string;
	rows: GamesMetricView[];
}

export interface FacilityLowReviewRow {
	id: string;
	rate: string;
	date: string;
	title: string;
}

export interface FacilitySatisfactionView extends FacilityMetricsSectionView {
	footnote: string | null;
	reviewsTitle: string;
	reviews: FacilityLowReviewRow[];
	emptyReviews: string;
}
