"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
	MapSearchProps,
	MarketSearchResult,
} from "@/presentation/components/map/MapSearch/MapSearchComponent.types";

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
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
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
		setQuery(market.name);
		setIsOpen(false);
		onMarketSelect(market);
	};

	const selectFacility = (facility: MapSearchProps["facilities"][number]) => {
		setQuery(facility.name);
		setIsOpen(false);
		onFacilitySelect(facility);
	};

	const clear = () => {
		setQuery("");
		setIsOpen(true);
		onClear();
	};

	return {
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
	};
}
