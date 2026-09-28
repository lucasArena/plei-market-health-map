const INDICATOR_PLACEHOLDERS = ["health", "players", "games", "facilities"];
const FACILITY_PLACEHOLDERS = ["1", "2", "3", "4", "5", "6", "7"];

export function MarketDetailPanelSkeleton() {
	return (
		<div data-testid="market-detail-skeleton" aria-hidden className="animate-pulse space-y-6 p-5">
			<div className="space-y-2">
				<div className="h-5 w-40 rounded bg-muted" />
				<div className="h-4 w-24 rounded bg-muted" />
			</div>
			<div className="grid grid-cols-2 gap-3">
				{INDICATOR_PLACEHOLDERS.map((key) => (
					<div key={key} className="h-20 rounded-lg bg-muted" />
				))}
			</div>
			<div className="space-y-4">
				<div className="h-4 w-28 rounded bg-muted" />
				{FACILITY_PLACEHOLDERS.map((key) => (
					<div key={key} className="flex items-center gap-3">
						<div className="size-10 shrink-0 rounded-full bg-muted" />
						<div className="flex-1 space-y-2">
							<div className="h-4 w-3/4 rounded bg-muted" />
							<div className="h-3 w-1/2 rounded bg-muted" />
						</div>
						<div className="h-4 w-12 rounded bg-muted" />
					</div>
				))}
			</div>
		</div>
	);
}
