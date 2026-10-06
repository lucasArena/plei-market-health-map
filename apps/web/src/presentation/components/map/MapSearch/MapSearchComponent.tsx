"use client";

import Image from "next/image";
import { useMapSearchRules } from "@/presentation/components/map/MapSearch/MapSearchComponent.rules";
import {
	MAP_MENU_COUNT_CLASS,
	MAP_MENU_GROUP_LABEL_CLASS,
	MAP_MENU_ROW_LABEL_CLASS,
	MAP_SEARCH_FIELD_CLASS,
	MAP_SEARCH_OPTION_HOVER_CLASS,
	MAP_SEARCH_RESULTS_CLASS,
	MAP_SEARCH_RESULTS_SCROLL_CLASS,
	MAP_SEARCH_ROOT_CLASS,
} from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";
import type { MapSearchProps } from "@/presentation/components/map/MapSearch/MapSearchComponent.types";

export function MapSearch(props: MapSearchProps) {
	const { messages } = props;
	const {
		cancelPrefetch,
		clear,
		facilityCountLabel,
		finishResultsMotion,
		handleChange,
		handleKeyDown,
		isOpen,
		isSearchingPlaces,
		isResultsShown,
		prefetchFacility,
		prefetchMarket,
		query,
		resultsMotion,
		rootRef,
		selectFacility,
		selectMarket,
		placeDetail,
		selectPlace,
		setIsOpen,
		showNoResults,
		showSearching,
		visibleFacilities,
		visibleMarkets,
		visiblePlaces,
	} = useMapSearchRules(props);
	const resultsMotionClass = {
		hidden: "",
		enter: "search-results-in",
		shown: "",
		exit: "search-results-out",
	}[resultsMotion];

	return (
		<div ref={rootRef} className={MAP_SEARCH_ROOT_CLASS}>
			<div className={MAP_SEARCH_FIELD_CLASS}>
				<Image src="/images/map-layers/search.svg" alt="" width={16} height={16} />
				<input
					aria-label={messages.searchPlaceholder}
					aria-autocomplete="list"
					autoComplete="off"
					autoCorrect="off"
					spellCheck={false}
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
				{isSearchingPlaces && (
					<span role="status" aria-label={messages.searchingPlaces} className="flex">
						<svg
							aria-hidden="true"
							data-testid="map-search-spinner"
							viewBox="0 0 24 24"
							className="size-4 animate-spin text-muted-foreground"
							fill="none"
						>
							<circle
								cx="12"
								cy="12"
								r="9"
								stroke="currentColor"
								strokeOpacity="0.25"
								strokeWidth="2.5"
							/>
							<path
								d="M21 12a9 9 0 0 0-9-9"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
							/>
						</svg>
					</span>
				)}
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
					<div className={MAP_SEARCH_RESULTS_SCROLL_CLASS}>
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
										<span className={MAP_MENU_COUNT_CLASS}>{facilityCountLabel(market)}</span>
									</button>
								))}
							</section>
						)}
						{visibleFacilities.length > 0 && (
							<section
								aria-labelledby="map-search-facilities"
								className={
									visibleMarkets.length > 0 ? "mt-1 border-t border-foreground/10 pt-1" : ""
								}
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
						{visiblePlaces.length > 0 && (
							<section
								aria-labelledby="map-search-places"
								className={
									visibleMarkets.length + visibleFacilities.length > 0
										? "mt-1 border-t border-foreground/10 pt-1"
										: ""
								}
							>
								<p
									id="map-search-places"
									className={`px-2.5 pt-1.5 pb-1 ${MAP_MENU_GROUP_LABEL_CLASS}`}
								>
									{messages.places}
								</p>
								{visiblePlaces.map((place) => (
									<button
										key={place.id}
										type="button"
										role="option"
										aria-selected="false"
										className={`block w-full rounded-lg px-2.5 py-2 text-left ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
										onClick={() => selectPlace(place)}
									>
										<span className={`block truncate ${MAP_MENU_ROW_LABEL_CLASS}`}>
											{place.name}
										</span>
										{placeDetail(place) && (
											<span className="block truncate text-xs text-muted-foreground">
												{placeDetail(place)}
											</span>
										)}
									</button>
								))}
								<p className="px-2.5 pt-1 pb-1.5 text-[10px] text-muted-foreground">
									{messages.placesAttribution}
								</p>
							</section>
						)}
						{showSearching && (
							<p className="px-3 py-4 text-center text-sm text-muted-foreground">
								{messages.searchingPlaces}
							</p>
						)}
						{showNoResults && (
							<p className="px-3 py-4 text-center text-sm text-muted-foreground">
								{messages.noSearchResults}
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
