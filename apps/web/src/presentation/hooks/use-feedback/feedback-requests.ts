import type { FeedbackType } from "@market-health-map/core/application";
import type { FeedbackRequestListener } from "@/presentation/hooks/use-feedback/feedback-requests.types";

const listeners = new Set<FeedbackRequestListener>();

export function requestFeedback(type: FeedbackType): void {
	for (const listener of listeners) listener(type);
}

export function onFeedbackRequest(listener: FeedbackRequestListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
