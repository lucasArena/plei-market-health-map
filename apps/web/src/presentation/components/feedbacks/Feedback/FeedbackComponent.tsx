"use client";

import { formatMessage } from "@market-health-map/core/i18n";
import {
	FEEDBACK_IMAGE_ACCEPT,
	useFeedbackRules,
} from "@/presentation/components/feedbacks/Feedback/FeedbackComponent.rules";
import {
	FEEDBACK_DROPZONE_CLASS,
	FEEDBACK_PANEL_ANIMATION_CLASS,
	FEEDBACK_PANEL_CLASS,
	FEEDBACK_TRIGGER_CLASS,
	FEEDBACK_TYPE_OPTIONS,
} from "@/presentation/components/feedbacks/Feedback/FeedbackComponent.styles";
import type { FeedbackProps } from "@/presentation/components/feedbacks/Feedback/FeedbackComponent.types";

function TypeIcon({ type }: Readonly<{ type: string }>) {
	if (type === "bug") {
		return (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				aria-hidden="true"
				className="size-5"
			>
				<path d="M8 8a4 4 0 0 1 8 0v1H8V8Z" />
				<rect x="7" y="9" width="10" height="11" rx="5" />
				<path d="M12 13v7M3 13h4M17 13h4M4 7l3 2M20 7l-3 2M4 20l3-2M20 20l-3-2" />
			</svg>
		);
	}
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			aria-hidden="true"
			className="size-5"
		>
			<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3Z" />
		</svg>
	);
}

export function Feedback(props: Readonly<FeedbackProps>) {
	const {
		attachHint,
		attachments,
		canAttachMore,
		canSubmit,
		characterCount,
		chooseType,
		close,
		containerRef,
		created,
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
		maxMessageLength,
		message,
		messages,
		notice,
		openFilePicker,
		removeAttachment,
		reset,
		retry,
		setMessage,
		step,
		submit,
		textareaRef,
		toggle,
		type,
	} = useFeedbackRules(props);
	const option = FEEDBACK_TYPE_OPTIONS.find((candidate) => candidate.type === type);
	const animationClass = FEEDBACK_PANEL_ANIMATION_CLASS[isClosing ? "closing" : "open"];
	const dropzoneClass = FEEDBACK_DROPZONE_CLASS[isDragging ? "dragging" : "idle"];

	return (
		<div ref={containerRef} data-testid="feedback-widget">
			<button
				type="button"
				onClick={toggle}
				aria-label={messages.open}
				aria-expanded={isOpen && !isClosing}
				aria-haspopup="dialog"
				className={FEEDBACK_TRIGGER_CLASS}
			>
				<span aria-hidden="true">?</span>
			</button>
			{isOpen && (
				<div
					role="dialog"
					aria-label={messages.title}
					data-state={isClosing ? "closing" : "open"}
					onAnimationEnd={handleAnimationEnd}
					className={`${FEEDBACK_PANEL_CLASS} ${animationClass}`}
				>
					<header className="flex items-start justify-between gap-3 bg-pleiful-pitch-green-80 px-4 pt-4 pb-3.5 text-white">
						<div>
							<h2 className="text-sm font-semibold tracking-tight">{messages.title}</h2>
							<p className="mt-0.5 text-[11px] text-white/75">{messages.subtitle}</p>
						</div>
						<button
							type="button"
							onClick={close}
							aria-label={messages.close}
							className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-white/80 transition-colors hover:bg-white/15 hover:text-white"
						>
							<span aria-hidden="true">×</span>
						</button>
					</header>
					{created && (
						<div role="status" className="flex flex-col items-center gap-2 px-5 py-7 text-center">
							<span className="flex size-10 items-center justify-center rounded-full bg-pleiful-pitch-green-5 text-pleiful-pitch-green-80">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.2"
									aria-hidden="true"
									className="size-5"
								>
									<path d="m5 12.5 4.5 4.5L19 7.5" />
								</svg>
							</span>
							<p className="text-sm font-semibold">{messages.successTitle}</p>
							<p className="text-xs text-muted-foreground">
								{messages.successDescription}{" "}
								<a
									href={created.url}
									target="_blank"
									rel="noreferrer"
									className="font-semibold text-pleiful-pitch-green-80 underline-offset-2 hover:underline"
								>
									{created.identifier}
								</a>
							</p>
							<button
								type="button"
								onClick={reset}
								className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
							>
								{messages.sendAnother}
							</button>
						</div>
					)}
					{!created && step === "type" && (
						<div className="flex flex-col gap-2 p-3">
							{FEEDBACK_TYPE_OPTIONS.map((candidate) => (
								<button
									key={candidate.type}
									type="button"
									onClick={() => chooseType(candidate.type)}
									className="group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-pleiful-pitch-green-30 hover:bg-pleiful-pitch-green-5"
								>
									<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pleiful-pitch-green-5 text-pleiful-pitch-green-80 transition-colors group-hover:bg-white">
										<TypeIcon type={candidate.type} />
									</span>
									<span>
										<span className="block text-sm font-semibold">{messages[candidate.title]}</span>
										<span className="mt-0.5 block text-xs text-muted-foreground">
											{messages[candidate.description]}
										</span>
									</span>
								</button>
							))}
						</div>
					)}
					{!created && step === "form" && option && (
						<form
							onSubmit={submit}
							onPaste={handlePaste}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							data-testid="feedback-form"
							className="flex flex-col gap-3 p-3"
						>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={goBack}
									className="rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									← {messages.back}
								</button>
								<span className="flex items-center gap-1.5 rounded-full bg-pleiful-pitch-green-5 px-2.5 py-1 text-xs font-medium text-pleiful-pitch-green-80">
									<TypeIcon type={option.type} />
									{messages[option.title]}
								</span>
							</div>
							<label className="flex flex-col gap-1">
								<span className="sr-only">{messages.messageLabel}</span>
								<textarea
									ref={textareaRef}
									required
									value={message}
									maxLength={maxMessageLength}
									onChange={(event) => setMessage(event.target.value)}
									placeholder={messages[option.placeholder]}
									rows={5}
									className="resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-pleiful-pitch-green-50 focus:ring-2 focus:ring-pleiful-pitch-green-10"
								/>
								<span className="self-end text-[10px] tabular-nums text-muted-foreground">
									{characterCount}
								</span>
							</label>
							<div
								data-testid="feedback-dropzone"
								data-dragging={isDragging}
								className={`rounded-lg border border-dashed p-2.5 transition-colors ${dropzoneClass}`}
							>
								<div className="flex items-center justify-between gap-2">
									<div>
										<p className="text-xs font-medium">{messages.attachLabel}</p>
										<p className="text-[10px] text-muted-foreground">
											{isDragging ? messages.dropHere : attachHint}
										</p>
									</div>
									<button
										type="button"
										onClick={openFilePicker}
										disabled={!canAttachMore}
										className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
									>
										{messages.attachButton}
									</button>
									<input
										ref={fileInputRef}
										type="file"
										multiple
										accept={FEEDBACK_IMAGE_ACCEPT}
										onChange={handleFileInputChange}
										data-testid="feedback-file-input"
										className="hidden"
									/>
								</div>
								{attachments.length > 0 && (
									<ul className="mt-2 flex flex-wrap gap-2">
										{attachments.map((attachment) => (
											<li key={attachment.id} className="relative">
												<span
													role="img"
													aria-label={attachment.file.name}
													data-testid="feedback-thumbnail"
													className="block size-14 rounded-md border bg-cover bg-center"
													style={{ backgroundImage: `url("${attachment.previewUrl}")` }}
												/>
												<button
													type="button"
													onClick={() => removeAttachment(attachment.id)}
													aria-label={formatMessage(messages.removeImage, {
														name: attachment.file.name,
													})}
													className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] leading-none text-background shadow"
												>
													<span aria-hidden="true">×</span>
												</button>
											</li>
										))}
									</ul>
								)}
								{notice && <p className="mt-2 text-[11px] text-destructive">{notice}</p>}
							</div>
							{error && (
								<div
									role="alert"
									className="flex items-start justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
								>
									<p>{error.message}</p>
									{error.canRetry && (
										<button
											type="button"
											onClick={retry}
											className="shrink-0 rounded-md border border-destructive/30 bg-background px-2 py-0.5 font-medium transition-colors hover:bg-destructive/10"
										>
											{messages.retry}
										</button>
									)}
								</div>
							)}
							<button
								type="submit"
								disabled={!canSubmit}
								className="flex items-center justify-center gap-2 rounded-lg bg-pleiful-pitch-green-80 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSubmitting && (
									<span
										aria-hidden="true"
										className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
									/>
								)}
								{isSubmitting ? messages.submitting : messages.submit}
							</button>
						</form>
					)}
				</div>
			)}
		</div>
	);
}
