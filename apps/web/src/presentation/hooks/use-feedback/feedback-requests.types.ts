import type { FeedbackType } from "@market-health-map/core/application";

export type FeedbackRequestListener = (type: FeedbackType) => void;
