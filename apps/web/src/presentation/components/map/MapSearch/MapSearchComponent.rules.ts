"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";
import type {
	MapSearchProps,
	MarketSearchResult,
} from "@/presentation/components/map/MapSearch/MapSearchComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { prefetchFacilityStats } from "@/presentation/hooks/use-facility/prefetch-facility-stats";
import { useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";
import { prefetchMarketSummary } from "@/presentation/hooks/use-market/prefetch-market-summary";
import { useIntentPrefetch } from "@/presentation/hooks/use-prefetch/use-intent-prefetch";

const RESULT_LIMIT = 8;

export function buildMarketSearchResults(
	facilities: MapSearchProps["facilities"],
): MarketSearchResult[] {
	const markets = new Map<string, MarketSearchResult>();
	for (const facility of facilities) {
		const current = markets.get(facility.marketId);
		if (current) {
			current.facilities.push(facility);
			continue;
		}
		markets.set(facility.marketId, {
			id: facility.marketId,
			name: facility.marketName,
			facilities: [facility],
		});
	}
	return [...markets.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function useMapSearchRules({
	facilities,
	onFacilitySelect,
	onMarketSelect,
	onClear,
}: MapSearchProps) {
	const { period } = useMapScope();
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const { finishReveal, isShown, motion } = useRevealMotion(isOpen);
	const rootRef = useRef<HTMLDivElement>(null);
	const queryClient = useQueryClient();
	const intent = useIntentPrefetch();
	const markets = useMemo(() => buildMarketSearchResults(facilities), [facilities]);
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const visibleMarkets = markets
		.filter((market) => market.name.toLocaleLowerCase().includes(normalizedQuery))
		.slice(0, RESULT_LIMIT);
	const visibleFacilities = facilities
		.filter((facility) => facility.name.toLocaleLowerCase().includes(normalizedQuery))
		.sort((a, b) => a.name.localeCompare(b.name))
		.slice(0, RESULT_LIMIT);

	useEffect(() => {
		const closeWhenOutside = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		document.addEventListener("pointerdown", closeWhenOutside);
		return () => document.removeEventListener("pointerdown", closeWhenOutside);
	}, []);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setQuery(event.target.value);
		setIsOpen(true);
		if (event.target.value.trim() === "") onClear();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Escape") setIsOpen(false);
	};

	const selectMarket = (market: MarketSearchResult) => {
		activityTracker.count("searches");
		setQuery(market.name);
		setIsOpen(false);
		onMarketSelect(market);
	};

	const selectFacility = (facility: MapSearchProps["facilities"][number]) => {
		activityTracker.count("searches");
		setQuery(facility.name);
		setIsOpen(false);
		onFacilitySelect(facility);
	};

	const prefetchMarket = (market: MarketSearchResult) =>
		intent.schedule(() => {
			void prefetchMarketSummary(queryClient, market.id, period).catch(() => undefined);
		});

	const prefetchFacility = (facility: MapSearchProps["facilities"][number]) =>
		intent.schedule(() => {
			void prefetchFacilityStats(queryClient, facility.id).catch(() => undefined);
		});

	const clear = () => {
		setQuery("");
		setIsOpen(true);
		onClear();
	};

	return {
		cancelPrefetch: intent.cancel,
		clear,
		finishResultsMotion: finishReveal,
		handleChange,
		handleKeyDown,
		isOpen,
		isResultsShown: isShown,
		prefetchFacility,
		prefetchMarket,
		query,
		resultsMotion: motion,
		rootRef,
		selectFacility,
		selectMarket,
		setIsOpen,
		visibleFacilities,
		visibleMarkets,
	};
}
