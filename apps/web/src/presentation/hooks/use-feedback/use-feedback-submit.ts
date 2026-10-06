"use client";

import {
	type FeedbackIssueView,
	MAX_FEEDBACK_REQUEST_BYTES,
} from "@market-health-map/core/application";
import { useMutation } from "@tanstack/react-query";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";
import { ApiError } from "@/infrastructure/api/client";
import { imageCompressor, totalBytes } from "@/infrastructure/image/image-compressor";
import type { FeedbackSubmission } from "@/presentation/hooks/use-feedback/use-feedback-submit.types";

export const FEEDBACK_ENDPOINT = "/api/v1/feedback";
export const FEEDBACK_UPLOAD_BUDGET_BYTES = MAX_FEEDBACK_REQUEST_BYTES - 64 * 1024;

export const FEEDBACK_TOO_LARGE_STATUS = 413;

const UNKNOWN_ERROR = { code: "UNKNOWN_ERROR", message: "" };
const TOO_LARGE_ERROR = { code: "PAYLOAD_TOO_LARGE", message: "" };

export function toFeedbackFormData(submission: FeedbackSubmission): FormData {
	const form = new FormData();
	form.append("type", submission.type);
	form.append("message", submission.message.trim());
	for (const image of submission.images) form.append("images", image, image.name);
	if (submission.pageUrl) form.append("pageUrl", submission.pageUrl);
	if (submission.view) form.append("view", submission.view);
	if (submission.appVersion) form.append("appVersion", submission.appVersion);
	return form;
}

export async function submitFeedback(submission: FeedbackSubmission): Promise<FeedbackIssueView> {
	const images = await imageCompressor.fitWithin(submission.images, FEEDBACK_UPLOAD_BUDGET_BYTES);
	if (totalBytes(images) > FEEDBACK_UPLOAD_BUDGET_BYTES) {
		throw new ApiError(FEEDBACK_TOO_LARGE_STATUS, TOO_LARGE_ERROR);
	}
	const response = await fetch(FEEDBACK_ENDPOINT, {
		method: "POST",
		body: toFeedbackFormData({ ...submission, images }),
		credentials: "include",
	});
	const body = await response.json().catch(() => null);
	if (!response.ok) throw new ApiError(response.status, body?.error ?? UNKNOWN_ERROR);
	return body.data as FeedbackIssueView;
}

export function useFeedbackSubmit() {
	return useMutation({
		mutationFn: submitFeedback,
		onSuccess: () => activityTracker.count("feedbackSent"),
	});
}
