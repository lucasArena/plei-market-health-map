"use client";

import Image from "next/image";
import { useMapSearchRules } from "@/presentation/components/map/MapSearch/MapSearchComponent.rules";
import {
	MAP_MENU_GROUP_LABEL_CLASS,
	MAP_MENU_ROW_LABEL_CLASS,
	MAP_SEARCH_FIELD_CLASS,
	MAP_SEARCH_OPTION_HOVER_CLASS,
	MAP_SEARCH_RESULTS_CLASS,
	MAP_SEARCH_ROOT_CLASS,
} from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";
import type { MapSearchProps } from "@/presentation/components/map/MapSearch/MapSearchComponent.types";

export function MapSearch(props: MapSearchProps) {
	const { messages } = props;
	const {
		cancelPrefetch,
		clear,
		finishResultsMotion,
		handleChange,
		handleKeyDown,
		isOpen,
		isResultsShown,
		prefetchFacility,
		prefetchMarket,
		query,
		resultsMotion,
		rootRef,
		selectFacility,
		selectMarket,
		setIsOpen,
		visibleFacilities,
		visibleMarkets,
	} = useMapSearchRules(props);
	const resultsMotionClass = {
		hidden: "",
		enter: "search-results-in",
		shown: "",
		exit: "search-results-out",
	}[resultsMotion];
	const hasResults = visibleMarkets.length > 0 || visibleFacilities.length > 0;

	return (
		<div ref={rootRef} className={MAP_SEARCH_ROOT_CLASS}>
			<div className={MAP_SEARCH_FIELD_CLASS}>
				<Image src="/images/map-layers/search.svg" alt="" width={16} height={16} />
				<input
					aria-label={messages.searchPlaceholder}
					aria-autocomplete="list"
					aria-controls="map-search-results"
					aria-expanded={isOpen}
					className="min-w-0 flex-1 bg-transparent text-[12px] text-map-icon outline-none placeholder:text-map-icon"
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
			{isResultsShown && (
				<div
					id="map-search-results"
					role="listbox"
					onAnimationEnd={finishResultsMotion}
					className={`${MAP_SEARCH_RESULTS_CLASS} ${resultsMotionClass}`}
				>
					{visibleMarkets.length > 0 && (
						<section aria-labelledby="map-search-markets">
							<p
								id="map-search-markets"
								className={`px-2.5 pt-1.5 pb-1 ${MAP_MENU_GROUP_LABEL_CLASS}`}
							>
								{messages.markets}
							</p>
							{visibleMarkets.map((market) => (
								<button
									key={market.id}
									type="button"
									role="option"
									aria-selected="false"
									className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
									onClick={() => selectMarket(market)}
									onPointerEnter={() => prefetchMarket(market)}
									onPointerLeave={cancelPrefetch}
									onFocus={() => prefetchMarket(market)}
								>
									<span className={`truncate ${MAP_MENU_ROW_LABEL_CLASS}`}>{market.name}</span>
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
							className={visibleMarkets.length > 0 ? "mt-1 border-t border-foreground/10 pt-1" : ""}
						>
							<p
								id="map-search-facilities"
								className={`px-2.5 pt-1.5 pb-1 ${MAP_MENU_GROUP_LABEL_CLASS}`}
							>
								{messages.facilities}
							</p>
							{visibleFacilities.map((facility) => (
								<button
									key={facility.id}
									type="button"
									role="option"
									aria-selected="false"
									className={`block w-full rounded-lg px-2.5 py-2 text-left ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
									onClick={() => selectFacility(facility)}
									onPointerEnter={() => prefetchFacility(facility)}
									onPointerLeave={cancelPrefetch}
									onFocus={() => prefetchFacility(facility)}
								>
									<span className={`block truncate ${MAP_MENU_ROW_LABEL_CLASS}`}>
										{facility.name}
									</span>
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
