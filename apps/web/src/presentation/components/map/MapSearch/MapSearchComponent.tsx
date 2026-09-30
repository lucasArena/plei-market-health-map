"use client";

import { useMapSearchRules } from "@/presentation/components/map/MapSearch/MapSearchComponent.rules";
import type { MapSearchProps } from "@/presentation/components/map/MapSearch/MapSearchComponent.types";

export function MapSearch(props: MapSearchProps) {
	const { messages } = props;
	const {
		clear,
		handleChange,
		handleKeyDown,
		isOpen,
		query,
		rootRef,
		selectFacility,
		selectMarket,
		setIsOpen,
		visibleFacilities,
		visibleMarkets,
	} = useMapSearchRules(props);
	const hasResults = visibleMarkets.length > 0 || visibleFacilities.length > 0;

	return (
		<div
			ref={rootRef}
			className="absolute top-5 left-1/2 z-20 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2"
		>
			<div className="flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/95 px-3 shadow-lg backdrop-blur-md">
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					className="size-4 shrink-0 text-muted-foreground"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<circle cx="11" cy="11" r="7" />
					<path d="m20 20-4-4" />
				</svg>
				<input
					aria-label={messages.searchPlaceholder}
					aria-autocomplete="list"
					aria-controls="map-search-results"
					aria-expanded={isOpen}
					className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
					placeholder={messages.searchPlaceholder}
					role="combobox"
					value={query}
					onChange={handleChange}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
				/>
				{query && (
					<button
						type="button"
						aria-label={messages.clearSearch}
						className="text-muted-foreground hover:text-foreground"
						onClick={clear}
					>
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M6 6l12 12M18 6 6 18" />
						</svg>
					</button>
				)}
			</div>
			{isOpen && (
				<div
					id="map-search-results"
					role="listbox"
					className="mt-2 max-h-[min(28rem,calc(100vh-6rem))] overflow-y-auto rounded-xl border border-border/70 bg-background/98 p-1.5 shadow-xl backdrop-blur-md"
				>
					{visibleMarkets.length > 0 && (
						<section aria-labelledby="map-search-markets">
							<p
								id="map-search-markets"
								className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
							>
								{messages.markets}
							</p>
							{visibleMarkets.map((market) => (
								<button
									key={market.id}
									type="button"
									role="option"
									aria-selected="false"
									className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
									onClick={() => selectMarket(market)}
								>
									<span className="truncate text-sm font-medium">{market.name}</span>
									<span className="ml-3 shrink-0 text-xs text-muted-foreground">
										{messages.facilityCount.replace("{count}", String(market.facilities.length))}
									</span>
								</button>
							))}
						</section>
					)}
					{visibleFacilities.length > 0 && (
						<section
							aria-labelledby="map-search-facilities"
							className={visibleMarkets.length > 0 ? "mt-1 border-t border-border/60 pt-1" : ""}
						>
							<p
								id="map-search-facilities"
								className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
							>
								{messages.facilities}
							</p>
							{visibleFacilities.map((facility) => (
								<button
									key={facility.id}
									type="button"
									role="option"
									aria-selected="false"
									className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
									onClick={() => selectFacility(facility)}
								>
									<span className="block truncate text-sm font-medium">{facility.name}</span>
									<span className="block truncate text-xs text-muted-foreground">
										{facility.marketName}
									</span>
								</button>
							))}
						</section>
					)}
					{!hasResults && (
						<p className="px-3 py-4 text-center text-sm text-muted-foreground">
							{messages.noSearchResults}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
