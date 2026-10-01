import type { FeedbackTypeOption } from "@/presentation/components/feedbacks/Feedback/FeedbackComponent.types";

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

export const ACCOUNT_STACK_CLASS =
	"pointer-events-none fixed bottom-[var(--map-profile-bottom)] left-[var(--map-frame)] z-40 flex w-max flex-col items-start";

export const ACCOUNT_TRIGGER_CLASS =
	"map-icon-button map-glass pointer-events-auto relative z-10 flex size-[var(--map-profile-size)] cursor-pointer items-center justify-center rounded-full border border-border/70 text-base font-semibold text-map-icon shadow-[var(--map-shadow)] transition-[background-color,color] focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-80 focus-visible:outline-none";

export const FEEDBACK_PANEL_CLASS =
	"fixed bottom-20 left-3 z-30 flex max-h-[calc(100dvh-7.5rem)] w-[min(22rem,calc(100vw-1.5rem))] origin-bottom-left flex-col overflow-y-auto rounded-2xl border bg-background shadow-2xl";

export const ACCOUNT_PANEL_CLASS =
	"pointer-events-auto absolute bottom-full left-0 z-50 mb-[var(--map-profile-legend-gap)] flex max-h-[calc(100dvh-var(--map-profile-bottom)-var(--map-profile-size)-var(--map-profile-legend-gap)-var(--map-frame))] w-[min(22rem,calc(100vw-2*var(--map-frame)))] origin-bottom-left flex-col overflow-y-auto map-glass rounded-2xl border shadow-[var(--map-shadow)]";

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
