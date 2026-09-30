import { z } from "zod";

export const FEEDBACK_TYPES = ["improvement", "bug"] as const;
export const FEEDBACK_IMAGE_CONTENT_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
] as const;
export const MAX_FEEDBACK_MESSAGE_LENGTH = 5000;
export const MAX_FEEDBACK_CONTEXT_LENGTH = 2048;
export const MAX_FEEDBACK_IMAGES = 5;
export const MAX_FEEDBACK_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_FEEDBACK_REQUEST_BYTES = 4 * 1024 * 1024;
export const DEFAULT_FEEDBACK_IMAGE_NAME = "screenshot";

const blankAsUndefined = (value: unknown) =>
	typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalContext = z.preprocess(
	blankAsUndefined,
	z.string().trim().max(MAX_FEEDBACK_CONTEXT_LENGTH).optional(),
);

export const feedbackImageSchema = z.object({
	filename: z
		.string()
		.trim()
		.max(255)
		.transform((name) => name || DEFAULT_FEEDBACK_IMAGE_NAME),
	contentType: z.string().pipe(z.enum(FEEDBACK_IMAGE_CONTENT_TYPES)),
	bytes: z
		.instanceof(Uint8Array)
		.refine((bytes) => bytes.byteLength > 0, "Image must not be empty.")
		.refine(
			(bytes) => bytes.byteLength <= MAX_FEEDBACK_IMAGE_BYTES,
			"Image must be at most 10 MB.",
		),
});

export const submitFeedbackSchema = z.object({
	type: z.string().pipe(z.enum(FEEDBACK_TYPES)),
	message: z.string().trim().min(1).max(MAX_FEEDBACK_MESSAGE_LENGTH),
	pageUrl: optionalContext,
	view: optionalContext,
	images: z.array(feedbackImageSchema).max(MAX_FEEDBACK_IMAGES).default([]),
	submitter: z.object({
		name: z.preprocess(blankAsUndefined, z.string().trim().max(255).nullish()),
		email: z.email(),
		avatarUrl: z.preprocess(
			blankAsUndefined,
			z
				.url({ protocol: /^https?$/ })
				.max(MAX_FEEDBACK_CONTEXT_LENGTH)
				.nullish()
				.catch(null),
		),
	}),
});
