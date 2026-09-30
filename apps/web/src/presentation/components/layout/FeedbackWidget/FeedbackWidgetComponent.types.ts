import type { FeedbackType } from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";

export interface FeedbackWidgetProps {
	facilityId?: string | null;
}

export type FeedbackStep = "type" | "form";

export type FeedbackMessages = Messages["feedback"];

export interface FeedbackAttachment {
	id: string;
	file: File;
	previewUrl: string;
}

export interface FeedbackImageSelection {
	accepted: File[];
	notice: string | null;
}

export interface FeedbackTypeOption {
	type: FeedbackType;
	title: keyof FeedbackMessages;
	description: keyof FeedbackMessages;
	placeholder: keyof FeedbackMessages;
}

export interface FeedbackErrorView {
	message: string;
	canRetry: boolean;
	isNotConfigured: boolean;
	blocksSubmit: boolean;
}
