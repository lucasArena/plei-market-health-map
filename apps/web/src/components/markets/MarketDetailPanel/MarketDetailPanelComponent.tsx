"use client";

import { FacilityAvatar } from "@/components/markets/FacilityAvatar/FacilityAvatarComponent";
import { useMarketDetailPanelRules } from "@/components/markets/MarketDetailPanel/MarketDetailPanelComponent.rules";
import type { MarketDetailPanelProps } from "@/components/markets/MarketDetailPanel/MarketDetailPanelComponent.types";
import { MarketDetailPanelSkeleton } from "@/components/markets/MarketDetailPanelSkeleton/MarketDetailPanelSkeletonComponent";

export function MarketDetailPanel(props: Readonly<MarketDetailPanelProps>) {
	const { messages, onClose, status, view } = useMarketDetailPanelRules(props);

	return (
		<aside
			aria-label={view?.header.title ?? messages.facilities}
			aria-busy={status === "loading"}
			className="absolute top-0 right-0 bottom-0 flex w-[min(400px,100%)] flex-col border-l bg-background shadow-2xl"
		>
			<button
				type="button"
				onClick={onClose}
				aria-label={messages.close}
				className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				×
			</button>
			<div className="min-h-0 flex-1 overflow-y-auto">
				{status === "loading" && <MarketDetailPanelSkeleton />}
				{status === "error" && (
					<p role="alert" className="p-5 pr-14 text-sm text-destructive">
						{messages.failed}
					</p>
				)}
				{status === "ready" && view && (
					<div className="space-y-6 p-5">
						<header className="space-y-1 pr-10">
							<h2 className="text-lg font-semibold">{view.header.title}</h2>
							<p className="text-sm text-muted-foreground">{view.header.subtitle}</p>
							<p className="flex items-center gap-2 text-sm text-muted-foreground">
								<span
									aria-hidden
									className="size-2.5 rounded-full"
									style={{ backgroundColor: view.header.statusColor }}
								/>
								{view.header.statusLabel}
							</p>
						</header>
						<section aria-labelledby="market-indicators" className="space-y-3">
							<h3
								id="market-indicators"
								className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								{messages.indicators}
							</h3>
							<dl className="grid grid-cols-2 gap-3">
								{view.indicators.map((indicator) => (
									<div key={indicator.key} className="rounded-lg border bg-card p-3">
										<dt className="text-xs text-muted-foreground">{indicator.label}</dt>
										<dd className="mt-1 text-xl font-semibold">
											{indicator.value}
											{indicator.suffix && (
												<span className="ml-0.5 text-sm font-normal text-muted-foreground">
													{indicator.suffix}
												</span>
											)}
										</dd>
									</div>
								))}
							</dl>
						</section>
						<section aria-labelledby="market-facilities" className="space-y-3">
							<div className="flex items-baseline justify-between">
								<h3
									id="market-facilities"
									className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>
									{messages.facilities}
								</h3>
								<span className="text-xs text-muted-foreground">{view.facilitiesCountLabel}</span>
							</div>
							{view.facilities.length === 0 ? (
								<p className="text-sm text-muted-foreground">{messages.empty}</p>
							) : (
								<ul className="divide-y">
									{view.facilities.map((facility) => (
										<li key={facility.id} className="flex items-center gap-3 py-3">
											<FacilityAvatar name={facility.name} avatarUrl={facility.avatarUrl} />
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">{facility.name}</p>
												<p className="truncate text-xs text-muted-foreground">{facility.address}</p>
												<p className="text-xs text-muted-foreground">{facility.playersLabel}</p>
											</div>
											<div className="shrink-0 text-right">
												<p className="text-sm font-medium">{facility.gamesLabel}</p>
												<p className="text-xs text-muted-foreground">{facility.utilizationLabel}</p>
											</div>
										</li>
									))}
								</ul>
							)}
						</section>
					</div>
				)}
			</div>
		</aside>
	);
}
