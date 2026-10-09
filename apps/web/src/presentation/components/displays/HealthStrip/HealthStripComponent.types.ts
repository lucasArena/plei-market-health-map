import type { ReactNode } from "react";
import type { InsightTone } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";

export interface HealthStripProps {
	children: ReactNode;
	tone?: InsightTone;
}
