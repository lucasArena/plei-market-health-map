"use client";

import {
	FEEDBACK_IMAGE_CONTENT_TYPES,
	type FeedbackType,
	MAX_FEEDBACK_IMAGE_BYTES,
	MAX_FEEDBACK_IMAGES,
	MAX_FEEDBACK_MESSAGE_LENGTH,
} from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import {
	type ChangeEvent,
	type ClipboardEvent,
	type DragEvent,
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { ApiError } from "@/infrastructure/api/client";
import { FEEDBACK_ERROR_KEY_BY_STATUS } from "@/presentation/components/feedbacks/Feedback/FeedbackComponent.styles";
import type {
	FeedbackAttachment,
	FeedbackErrorView,
	FeedbackImageSelection,
	FeedbackMessages,
	FeedbackProps,
	FeedbackStep,
} from "@/presentation/components/feedbacks/Feedback/FeedbackComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFeedbackSubmit } from "@/presentation/hooks/use-feedback/use-feedback-submit";

const FEEDBACK_VIEW = "facilities-map";

const ACCEPTED_TYPES: readonly string[] = FEEDBACK_IMAGE_CONTENT_TYPES;

export const FEEDBACK_IMAGE_ACCEPT = FEEDBACK_IMAGE_CONTENT_TYPES.join(",");

export function selectFeedbackImages(
	files: readonly File[],
	existingCount: number,
	messages: FeedbackMessages,
): FeedbackImageSelection {
	const notices: string[] = [];
	const valid = files.filter((file) => {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			notices.push(formatMessage(messages.unsupportedImage, { name: file.name }));
			return false;
		}
		if (file.size > MAX_FEEDBACK_IMAGE_BYTES) {
			notices.push(formatMessage(messages.imageTooLarge, { name: file.name }));
			return false;
		}
		return true;
	});
	const room = Math.max(MAX_FEEDBACK_IMAGES - existingCount, 0);
	if (valid.length > room) {
		notices.push(formatMessage(messages.tooManyImages, { max: MAX_FEEDBACK_IMAGES }));
	}
	return { accepted: valid.slice(0, room), notice: notices[0] ?? null };
}

export function describeFeedbackError(
	error: unknown,
	messages: FeedbackMessages,
): FeedbackErrorView {
	if (!(error instanceof ApiError)) {
		return {
			message: messages.failed,
			canRetry: true,
			isNotConfigured: false,
			blocksSubmit: false,
		};
	}
	const fallback = messages[FEEDBACK_ERROR_KEY_BY_STATUS[error.status] ?? "failed"];
	const hasServerMessage = error.code !== "UNKNOWN_ERROR" && error.message.length > 0;
	return {
		message: hasServerMessage ? error.message : fallback,
		canRetry: error.status >= 500 && error.status !== 503,
		isNotConfigured: error.status === 503,
		blocksSubmit: error.status === 503 || error.status === 413,
	};
}

function filesFromClipboard(event: ClipboardEvent): File[] {
	return Array.from(event.clipboardData?.items ?? [])
		.filter((item) => item.kind === "file")
		.map((item) => item.getAsFile())
		.filter((file): file is File => file !== null);
}

export function feedbackView(facilityId: string | null | undefined): string {
	return facilityId ? `${FEEDBACK_VIEW} (facility ${facilityId})` : FEEDBACK_VIEW;
}

export function useFeedbackRules({ facilityId: suppliedFacilityId, user }: FeedbackProps) {
	const { selectedFacilityId } = useMapScope();
	const facilityId = suppliedFacilityId ?? selectedFacilityId;
	const { messages } = useMessages();
	const feedbackMessages = messages.feedback;
	const submission = useFeedbackSubmit();
	const [isOpen, setIsOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [step, setStep] = useState<FeedbackStep>("home");
	const [type, setType] = useState<FeedbackType>("improvement");
	const [message, setMessage] = useState("");
	const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
	const [notice, setNotice] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const nextAttachmentId = useRef(0);
	const attachmentsRef = useRef<FeedbackAttachment[]>([]);
	attachmentsRef.current = attachments;

	const close = useCallback(() => setIsClosing(true), []);

	const toggle = useCallback(() => {
		if (isOpen && !isClosing) {
			setIsClosing(true);
			return;
		}
		setIsClosing(false);
		setStep("home");
		setIsOpen(true);
	}, [isClosing, isOpen]);

	const reset = useCallback(() => {
		for (const attachment of attachmentsRef.current) URL.revokeObjectURL(attachment.previewUrl);
		setAttachments([]);
		setMessage("");
		setNotice(null);
		setStep("home");
		submission.reset();
	}, [submission]);

	const handleAnimationEnd = useCallback(
		(event: { target: EventTarget; currentTarget: EventTarget }) => {
			if (!isClosing || event.target !== event.currentTarget) return;
			setIsClosing(false);
			setIsOpen(false);
			if (submission.isSuccess) reset();
		},
		[isClosing, reset, submission.isSuccess],
	);

	useEffect(() => {
		if (!isOpen || isClosing) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsClosing(true);
		};
		const closeOnOutsideClick = (event: MouseEvent) => {
			const target = event.target as Node;
			if (containerRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
			setIsClosing(true);
		};
		window.addEventListener("keydown", closeOnEscape);
		window.addEventListener("mousedown", closeOnOutsideClick);
		return () => {
			window.removeEventListener("keydown", closeOnEscape);
			window.removeEventListener("mousedown", closeOnOutsideClick);
		};
	}, [isClosing, isOpen]);

	useEffect(() => {
		if (isOpen && step === "form") textareaRef.current?.focus();
	}, [isOpen, step]);

	useEffect(
		() => () => {
			for (const attachment of attachmentsRef.current) URL.revokeObjectURL(attachment.previewUrl);
		},
		[],
	);

	const chooseType = useCallback((next: FeedbackType) => {
		setType(next);
		setStep("form");
	}, []);

	const goBack = useCallback(() => setStep("home"), []);

	const addFiles = useCallback(
		(files: readonly File[]) => {
			if (files.length === 0) return;
			const { accepted, notice: nextNotice } = selectFeedbackImages(
				files,
				attachmentsRef.current.length,
				feedbackMessages,
			);
			setNotice(nextNotice);
			if (accepted.length === 0) return;
			const added = accepted.map((file) => {
				nextAttachmentId.current += 1;
				return {
					id: `attachment-${nextAttachmentId.current}`,
					file,
					previewUrl: URL.createObjectURL(file),
				};
			});
			setAttachments((current) => [...current, ...added]);
			if (submission.isError) submission.reset();
		},
		[feedbackMessages, submission],
	);

	const removeAttachment = useCallback(
		(id: string) => {
			setNotice(null);
			if (submission.isError) submission.reset();
			setAttachments((current) =>
				current.filter((attachment) => {
					if (attachment.id !== id) return true;
					URL.revokeObjectURL(attachment.previewUrl);
					return false;
				}),
			);
		},
		[submission],
	);

	const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

	const handleFileInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			addFiles(Array.from(event.target.files ?? []));
			event.target.value = "";
		},
		[addFiles],
	);

	const handlePaste = useCallback(
		(event: ClipboardEvent) => {
			const files = filesFromClipboard(event);
			if (files.length === 0) return;
			event.preventDefault();
			addFiles(files);
		},
		[addFiles],
	);

	const handleDragOver = useCallback((event: DragEvent) => {
		event.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((event: DragEvent) => {
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(event: DragEvent) => {
			event.preventDefault();
			setIsDragging(false);
			addFiles(Array.from(event.dataTransfer?.files ?? []));
		},
		[addFiles],
	);

	const trimmedMessage = message.trim();
	const isSubmitting = submission.isPending;
	const error = submission.isError
		? describeFeedbackError(submission.error, feedbackMessages)
		: null;
	const canSubmit = trimmedMessage.length > 0 && !isSubmitting && !error?.blocksSubmit;

	const submit = useCallback(
		(event?: FormEvent) => {
			event?.preventDefault();
			if (!canSubmit) return;
			submission.mutate({
				type,
				message: trimmedMessage,
				images: attachments.map((attachment) => attachment.file),
				pageUrl: window.location.href,
				view: feedbackView(facilityId),
			});
		},
		[attachments, canSubmit, facilityId, submission, trimmedMessage, type],
	);

	return {
		accountMessages: messages.auth,
		addFiles,
		attachHint: formatMessage(feedbackMessages.attachHint, { max: MAX_FEEDBACK_IMAGES }),
		attachments,
		canAttachMore: attachments.length < MAX_FEEDBACK_IMAGES,
		canSubmit,
		characterCount: formatMessage(feedbackMessages.characterCount, {
			count: message.length,
			max: MAX_FEEDBACK_MESSAGE_LENGTH,
		}),
		chooseType,
		close,
		containerRef,
		triggerRef,
		created: submission.data ?? null,
		error,
		fileInputRef,
		goBack,
		handleAnimationEnd,
		handleDragLeave,
		handleDragOver,
		handleDrop,
		handleFileInputChange,
		handlePaste,
		isClosing,
		isDragging,
		isOpen,
		isSubmitting,
		maxMessageLength: MAX_FEEDBACK_MESSAGE_LENGTH,
		message,
		messages: feedbackMessages,
		notice,
		openFilePicker,
		removeAttachment,
		reset,
		retry: () => submit(),
		setMessage,
		step,
		submit,
		textareaRef,
		toggle,
		type,
		user,
	};
}
