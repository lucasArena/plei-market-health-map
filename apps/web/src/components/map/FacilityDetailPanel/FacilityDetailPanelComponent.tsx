"use client";

import { FacilityAiSummary } from "@/components/map/FacilityAiSummary/FacilityAiSummaryComponent";
import { FacilityAvatar } from "@/components/map/FacilityAvatar/FacilityAvatarComponent";
import { useFacilityDetailPanelRules } from "@/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	HINT_CLASS,
	PANEL_CLASS,
} from "@/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.styles";
import type { FacilityDetailPanelProps } from "@/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";

const SKELETON_TILES = ["played", "scheduled", "cancelled", "upcoming"];

function FacilityDetailSkeleton() {
	return (
		<div data-testid="facility-detail-skeleton" aria-hidden className="animate-pulse space-y-5 p-5">
			<div className="flex items-center gap-3">
				<div className="size-12 rounded-full bg-muted" />
				<div className="flex-1 space-y-2">
					<div className="h-4 w-3/4 rounded bg-muted" />
					<div className="h-3 w-1/2 rounded bg-muted" />
				</div>
			</div>
			<div className="space-y-2">
				<div className="h-3 w-full rounded bg-muted" />
				<div className="h-3 w-5/6 rounded bg-muted" />
			</div>
			<div className="grid grid-cols-2 gap-3">
				{SKELETON_TILES.map((key) => (
					<div key={key} className="h-20 rounded-xl bg-muted" />
				))}
			</div>
		</div>
	);
}

export function FacilityDetailPanel(props: Readonly<FacilityDetailPanelProps>) {
	const { detail, handleAnimationEnd, isClosing, messages, onClose, status, view } =
		useFacilityDetailPanelRules(props);

	return (
		<aside
			aria-label={messages.label}
			aria-busy={status === "loading"}
			data-closing={isClosing}
			onAnimationEnd={handleAnimationEnd}
			className={`${isClosing ? "panel-slide-out" : "panel-slide-in"} ${PANEL_CLASS}`}
		>
			<button
				type="button"
				onClick={onClose}
				aria-label={messages.close}
				className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				×
			</button>
			<div className="min-h-0 flex-1 overflow-y-auto">
				{status === "loading" && <FacilityDetailSkeleton />}
				{status === "error" && (
					<p role="alert" className="p-5 pr-12 text-sm text-destructive">
						{messages.failed}
					</p>
				)}
				{status === "ready" && view && detail && (
					<div className="space-y-5 p-5">
						<header className="flex items-center gap-3 pr-8">
							<FacilityAvatar name={view.name} avatarUrl={view.avatarUrl} />
							<div className="min-w-0">
								<h2 className="truncate text-base font-semibold">{view.name}</h2>
								<p className="truncate text-xs text-muted-foreground">{view.address}</p>
							</div>
						</header>
						<FacilityAiSummary detail={detail} fallback={view.summary} />
						<dl className="grid grid-cols-2 gap-3">
							{view.tiles.map((tile) => (
								<div key={tile.key} className="rounded-xl border bg-card p-3">
									<dt className="text-xs text-muted-foreground">{tile.label}</dt>
									<dd className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</dd>
									{tile.hint && (
										<dd className={`mt-0.5 text-[11px] ${HINT_CLASS[tile.hintDirection]}`}>
											{tile.hint}
										</dd>
									)}
								</div>
							))}
						</dl>
						<footer className="space-y-0.5 border-t pt-3 text-[11px] text-muted-foreground">
							<p>{view.weekLabel}</p>
							<p>{view.lastPlayedLabel}</p>
						</footer>
					</div>
				)}
			</div>
		</aside>
	);
}
