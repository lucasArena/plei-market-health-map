import type { FeedbackTypeOption } from "@/presentation/components/layout/FeedbackWidget/FeedbackWidgetComponent.types";

export const FEEDBACK_TYPE_OPTIONS: readonly FeedbackTypeOption[] = [
	{
		type: "improvement",
		title: "improvementTitle",
		description: "improvementDescription",
		placeholder: "improvementPlaceholder",
	},
	{
		type: "bug",
		title: "bugTitle",
		description: "bugDescription",
		placeholder: "bugPlaceholder",
	},
];

export const FEEDBACK_TRIGGER_CLASS =
	"fixed bottom-8 left-3 z-30 flex size-10 items-center justify-center rounded-full bg-pleiful-pitch-green-80 text-base font-semibold text-white shadow-lg ring-offset-2 transition-transform duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-80 focus-visible:outline-none active:scale-95";

export const FEEDBACK_PANEL_CLASS =
	"fixed bottom-20 left-3 z-30 flex max-h-[calc(100dvh-7.5rem)] w-[min(22rem,calc(100vw-1.5rem))] origin-bottom-left flex-col overflow-y-auto rounded-2xl border bg-background shadow-2xl";

export const FEEDBACK_PANEL_ANIMATION_CLASS = {
	open: "feedback-pop-in",
	closing: "feedback-pop-out",
} as const;

export const FEEDBACK_DROPZONE_CLASS = {
	idle: "border-border",
	dragging: "border-pleiful-pitch-green-50 bg-pleiful-pitch-green-5",
} as const;

export const FEEDBACK_ERROR_KEY_BY_STATUS: Readonly<
	Record<number, "notConfigured" | "deliveryFailed" | "invalid" | "tooLarge">
> = {
	400: "invalid",
	413: "tooLarge",
	502: "deliveryFailed",
	503: "notConfigured",
};
