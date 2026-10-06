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

export const FEEDBACK_STACK_CLASS =
	"pointer-events-none fixed bottom-[var(--map-profile-bottom)] left-[var(--map-frame)] z-40 flex w-max flex-col items-start gap-[var(--map-profile-legend-gap)]";

export const FEEDBACK_LEGEND_SLOT_CLASS = "relative z-0 empty:hidden";

export const FEEDBACK_LEGEND_SLOT_VISIBILITY_CLASS = { open: "invisible", closed: "" };

export const FEEDBACK_TRIGGER_CLASS =
	"map-icon-button map-glass pointer-events-auto relative z-10 flex size-[var(--map-profile-size)] cursor-pointer items-center justify-center rounded-full border border-border/70 text-base font-semibold text-map-icon shadow-[var(--map-shadow)] transition-[box-shadow,border-color] focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-80 focus-visible:outline-none";

export const FEEDBACK_PANEL_CLASS =
	"pointer-events-auto absolute bottom-[calc(var(--map-profile-size)+var(--map-profile-legend-gap))] left-0 z-50 flex max-h-[calc(100dvh-var(--map-profile-bottom)-var(--map-profile-size)-var(--map-profile-legend-gap)-var(--map-frame))] w-[min(22rem,calc(100vw-2*var(--map-frame)))] origin-bottom-left flex-col overflow-y-auto map-glass rounded-[var(--map-radius)] border shadow-[var(--map-shadow)]";

export const FEEDBACK_PANEL_ANIMATION_CLASS = {
	open: "feedback-pop-in",
	closing: "feedback-pop-out",
} as const;

export const FEEDBACK_DROPZONE_CLASS = {
	idle: "border-border",
	dragging: "border-pleiful-pitch-green-50 bg-pleiful-pitch-green-5",
} as const;

export const FEEDBACK_CLOSE_CLASS =
	"flex size-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export const FEEDBACK_ICON_WELL_CLASS =
	"flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/70 text-map-icon";

export const FEEDBACK_MENU_ITEM_CLASS =
	"relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

export const FEEDBACK_MENU_SEPARATOR_CLASS = "-mx-1 my-1 h-px bg-border";

export const FEEDBACK_ERROR_KEY_BY_STATUS: Readonly<
	Record<number, "notConfigured" | "deliveryFailed" | "invalid" | "tooLarge">
> = {
	400: "invalid",
	413: "tooLarge",
	502: "deliveryFailed",
	503: "notConfigured",
};
