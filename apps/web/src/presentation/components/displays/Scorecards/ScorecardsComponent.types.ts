import type { ScoreCardProps } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent.types";

export type ScorecardView = Omit<ScoreCardProps, "testId" | "size">;

export interface ScorecardsProps {
	title: string;
	played: ScorecardView;
	confirmation: ScorecardView;
	cancellation: ScorecardView;
}
