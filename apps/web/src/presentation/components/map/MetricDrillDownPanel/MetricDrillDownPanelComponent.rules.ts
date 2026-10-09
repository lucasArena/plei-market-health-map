"use client";

import type {
	DrillDownMeasure,
	DrillDownRange,
	DrillDownSegment,
	DrillDownSlice,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@market-health-map/core/application";
import {
	canSegmentDrillDown,
	canSliceDrillDownByDepartment,
	DRILL_DOWN_DEPARTMENTS,
} from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { formatMessage } from "@market-health-map/core/i18n";
import { type AnimationEvent, useEffect, useRef, useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import type {
	DrillDownChartRow,
	DrillDownSort,
	MetricDrillDownFocus,
	MetricDrillDownPanelProps,
	MetricDrillDownSelection,
} from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityListAll } from "@/presentation/hooks/use-facility/use-facility-list-all";
import { useMetricDrillDown } from "@/presentation/hooks/use-metric/use-metric-drill-down";

function rangeFromPeriod(period: string): DrillDownRange {
	return period === "week" ? "7d" : "28d";
}

const EMPTY_VIEW: MetricDrillDownView = {
	total: 0,
	rows: [],
	start: "1970-01-01",
	end: "1970-01-01",
	measure: "games",
	range: "28d",
	kind: "count",
};

export function useMetricDrillDownPanelRules({
	isOpen,
	isClosing,
	onClosed,
	onClose,
	triggerRef,
}: MetricDrillDownPanelProps) {
	const { scope, period, setMapNavigation, setMetricFocus } = useMapScope();
	const { messages, locale } = useMessages();
	const facilitiesQuery = useFacilityListAll();
	const layers = useMapLayers();
	const gameDepartments = layers?.gameDepartments;
	const showSupply = layers?.showActiveFacilities ?? true;
	const departmentKey = gameDepartments?.join(",") ?? "";
	const scopeKey = scope.kind === "all" ? "all" : `${scope.kind}:${scope.id}`;
	const [selection, setSelection] = useState<MetricDrillDownSelection>({
		measure: "games",
		slice: scope.kind === "all" ? "market" : "facility",
		segment: "none",
	});
	const [range, setRangeState] = useState<DrillDownRange>(() => rangeFromPeriod(period));
	const [previousPeriod, setPreviousPeriod] = useState(period);
	if (previousPeriod !== period) {
		setPreviousPeriod(period);
		setRangeState(rangeFromPeriod(period));
	}
	const [focus, setFocus] = useState<MetricDrillDownFocus | null>(null);
	const [previousDepartments, setPreviousDepartments] = useState(departmentKey);
	if (previousDepartments !== departmentKey) {
		setPreviousDepartments(departmentKey);
		setFocus(null);
	}
	const [previousScope, setPreviousScope] = useState(scopeKey);
	if (previousScope !== scopeKey) {
		setPreviousScope(scopeKey);
		setFocus(null);
		setSelection((current) => ({
			measure: current.measure,
			slice: scope.kind === "all" ? "market" : "facility",
			segment: current.segment,
		}));
	}
	const [isExpanded, setExpanded] = useState(false);
	const toggleExpanded = () => setExpanded((current) => !current);
	function handleAnimationEnd(event: AnimationEvent<HTMLElement>) {
		if (event.target === event.currentTarget && isClosing) onClosed?.();
	}
	const [sort, setSort] = useState<DrillDownSort>("count-desc");
	const panelRef = useRef<HTMLElement>(null);
	const expandButtonRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (!isOpen) return;
		expandButtonRef.current?.focus();
	}, [isOpen]);
	useEffect(() => {
		if (!isOpen) return;
		function onKey(event: KeyboardEvent) {
			if (event.key !== "Escape") return;
			event.preventDefault();
			if (isExpanded) {
				setExpanded(false);
				return;
			}
			onClose();
			triggerRef.current?.focus();
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, isExpanded, onClose, triggerRef]);
	const query = useMetricDrillDown({
		measure: selection.measure,
		range,
		slice: selection.slice,
		segment: selection.segment,
		marketId: scope.kind === "market" ? scope.id : undefined,
		facilityId: scope.kind === "facility" ? scope.id : undefined,
		departments: gameDepartments,
		enabled: isOpen && showSupply,
	});
	const view = showSupply ? (query.data ?? EMPTY_VIEW) : EMPTY_VIEW;
	const focusedRow = view.rows.find((row) => row.id === focus?.rowId);
	const focusedValue = focus?.department
		? (focusedRow?.departments?.[focus.department] ?? null)
		: (focusedRow?.value ?? null);
	const hasFocus = !!focusedRow;
	useEffect(() => {
		if (!focusedRow) {
			setMetricFocus(null);
			return;
		}
		const facilityIds = (facilitiesQuery.data ?? [])
			.filter(
				(facility) =>
					(scope.kind !== "market" || facility.marketId === scope.id) &&
					(scope.kind !== "facility" || facility.id === scope.id) &&
					(selection.slice !== "market" || facility.marketId === focusedRow.id) &&
					(selection.slice !== "facility" || facility.id === focusedRow.id),
			)
			.map((facility) => facility.id);
		const department =
			selection.slice === "department" ? (focusedRow.id as GameDepartment) : focus?.department;
		setMetricFocus({ facilityIds, department });
	}, [focusedRow, facilitiesQuery.data, scope, selection.slice, focus?.department, setMetricFocus]);
	useEffect(() => () => setMetricFocus(null), [setMetricFocus]);
	function toggleFocus(row: MetricDrillDownRow, department?: GameDepartment) {
		setFocus((current) =>
			current?.rowId === row.id && current.department === department
				? null
				: { rowId: row.id, department },
		);
	}
	const isSelected = (row: MetricDrillDownRow, department?: GameDepartment) =>
		focus?.rowId === row.id && (department === undefined || focus.department === department);
	const canSegment = canSegmentDrillDown(selection.measure, selection.slice);
	const segment = canSegment ? selection.segment : "none";
	const number = new Intl.NumberFormat(locale);
	const rate = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});
	const date = new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
	const measureLabels = {
		games: messages.drillDown.games,
		"active-facilities": messages.drillDown.activeFacilities,
		"scheduled-games": messages.drillDown.scheduledGames,
		"confirmation-rate": messages.drillDown.confirmationRate,
		"unique-players": messages.drillDown.uniquePlayers,
		"activated-players": messages.drillDown.activatedPlayers,
		"almost-filled-rate": messages.drillDown.almostFilledRate,
		"incident-games-rate": messages.drillDown.incidentGamesRate,
	};
	const formatValue = (value: number | null) =>
		value === null
			? messages.drillDown.unavailable
			: {
					true: `${rate.format(value)}%`,
					false: number.format(value),
				}[`${view.kind === "rate"}`];
	const rateParts = (parts: {
		numerator?: number | null;
		denominator?: number | null;
		dataErrors?: number;
	}) => {
		if (view.kind !== "rate" || parts.numerator == null || parts.denominator == null)
			return undefined;
		const values = {
			numerator: number.format(parts.numerator),
			denominator: number.format(parts.denominator),
			errors: number.format(parts.dataErrors ?? 0),
		};
		return formatMessage(
			parts.dataErrors ? messages.drillDown.ratioWithErrors : messages.drillDown.ratio,
			values,
		);
	};
	const headlinePartsTemplates: Partial<Record<DrillDownMeasure, string>> = {
		"confirmation-rate": messages.drillDown.confirmationParts,
		"almost-filled-rate": messages.drillDown.almostFilledParts,
		"incident-games-rate": messages.drillDown.incidentRateParts,
	};
	const departmentNames = {
		magic: messages.map.gameDepartmentMagic,
		organizers: messages.map.gameDepartmentOrganizers,
		partnerships: messages.map.gameDepartmentPartnerships,
	};
	const rowName = (row: MetricDrillDownRow) =>
		selection.slice === "department" ? departmentNames[row.id as GameDepartment] : row.name;
	const visibleRows = hasFocus ? [{ ...focusedRow, value: focusedValue }] : view.rows;
	const rows = [...visibleRows].sort((a, b) => {
		if (sort === "name-asc") return rowName(a).localeCompare(rowName(b), locale);
		if (sort === "name-desc") return rowName(b).localeCompare(rowName(a), locale);
		if (a.value === null && b.value === null) return 0;
		if (a.value === null) return 1;
		if (b.value === null) return -1;
		const delta = a.value - b.value;
		return (sort === "count-asc" ? delta : -delta) || rowName(a).localeCompare(rowName(b), locale);
	});
	const topRows = [...visibleRows].sort((a, b) => (b.value ?? -1) - (a.value ?? -1)).slice(0, 10);
	const largest = Math.max(1, ...topRows.map((row) => row.value ?? 0));
	const magnitude = 10 ** Math.floor(Math.log10(largest / 5));
	const step = Math.max(1, Math.ceil(largest / magnitude / 5) * magnitude);
	const max = Math.ceil(largest / step) * step;
	const ticks = Array.from({ length: Math.ceil(max / step) + 1 }, (_, index) => index * step);

	const appliedDepartments = gameDepartments?.length ? gameDepartments : DRILL_DOWN_DEPARTMENTS;
	const selectedDepartments =
		hasFocus && focus?.department ? [focus.department] : appliedDepartments;
	const chartRows: DrillDownChartRow[] = topRows.map((row) => {
		if (row.value === null) return { ...row, bars: [] };
		if (segment === "department") {
			const counts = row.departments;
			if (!counts) return { ...row, bars: [] };
			return {
				...row,
				bars: selectedDepartments
					.flatMap((department) => {
						const value = counts[department];
						if (value === null) return [];
						return [
							{
								id: department,
								department,
								label: `${rowName(row)} · ${departmentNames[department]}: ${formatValue(value)}`,
								value,
								height: (value / max) * 100,
							},
						];
					})
					.map((bar, index, bars) => ({
						...bar,
						isTop: bars.slice(index + 1).every((above) => above.value === 0),
					})),
			};
		}
		return {
			...row,
			bars: [
				{
					id: "total",
					label: [`${rowName(row)}: ${formatValue(row.value)}`, rateParts(row)]
						.filter(Boolean)
						.join(" · "),
					value: row.value,
					height: (row.value / max) * 100,
					isTop: true,
				},
			],
		};
	});
	function tooltipAlignment(row: MetricDrillDownRow) {
		if (row.id === chartRows[0]?.id) return "left-0";
		if (row.id === chartRows.at(-1)?.id) return "right-0";
		return "left-1/2 -translate-x-1/2";
	}

	function setMeasure(measure: DrillDownMeasure) {
		setFocus(null);
		setSelection((current) => ({
			...current,
			measure,
			slice:
				!canSliceDrillDownByDepartment(measure) && current.slice === "department"
					? "market"
					: current.slice,
			segment: canSliceDrillDownByDepartment(measure) ? current.segment : "none",
		}));
	}
	function setSlice(slice: DrillDownSlice) {
		setFocus(null);
		setSelection((current) => ({
			...current,
			slice,
			segment: slice === "department" ? "none" : current.segment,
		}));
	}
	function setSegment(next: DrillDownSegment) {
		setFocus(null);
		setSelection((current) => ({ ...current, segment: next }));
	}
	function setRange(next: DrillDownRange) {
		setFocus(null);
		setRangeState(next);
	}
	function viewOnMap(row: MetricDrillDownRow) {
		const facilityIds = (facilitiesQuery.data ?? [])
			.filter(
				(facility) =>
					(scope.kind !== "market" || facility.marketId === scope.id) &&
					(scope.kind !== "facility" || facility.id === scope.id) &&
					(selection.slice === "market" ? facility.marketId === row.id : facility.id === row.id),
			)
			.map((facility) => facility.id);
		setMapNavigation({ kind: "metric-focus", facilityIds });
	}

	const heading = scope.kind === "all" ? messages.drillDown.allMarkets : scope.name;
	const headlineSource = focusedRow ?? view;
	const headlineTemplate = headlinePartsTemplates[selection.measure];
	const headlineParts =
		headlineTemplate &&
		!focus?.department &&
		headlineSource.numerator != null &&
		headlineSource.denominator != null
			? formatMessage(headlineTemplate, {
					numerator: number.format(headlineSource.numerator),
					denominator: number.format(headlineSource.denominator),
				})
			: undefined;
	const dataErrors = headlineSource.dataErrors ?? 0;
	return {
		messages: messages.drillDown,
		measureLabel: measureLabels[selection.measure],
		valueLabel: view.kind === "rate" ? messages.drillDown.rate : messages.drillDown.value,
		selection,
		range,
		segment,
		canSegment,
		canSliceByDepartment: canSliceDrillDownByDepartment(selection.measure),
		setMeasure,
		setSlice,
		setSegment,
		setRange,
		rows,
		chartRows,
		tooltipAlignment,
		max,
		ticks,
		isExpanded,
		toggleExpanded,
		handleAnimationEnd,
		view,
		chartTruncated: !hasFocus && view.rows.length > 10,
		headlineValue: hasFocus ? focusedValue : view.total,
		headlineParts,
		dataErrorsMessage:
			dataErrors > 0
				? formatMessage(messages.drillDown.rosterDataErrors, { count: number.format(dataErrors) })
				: undefined,
		showReviewsLag: selection.measure === "incident-games-rate",
		rateParts,
		focusLabel: hasFocus
			? `${rowName(focusedRow)}${focus?.department ? ` · ${departmentNames[focus.department]}` : ""}`
			: undefined,
		toggleFocus,
		isSelected,
		showScopeBack: scope.kind !== "all",
		clearScope: () => {
			setFocus(null);
			setMapNavigation({ kind: "all" });
		},
		formatValue,
		rowName,
		departmentNames,
		departments: selectedDepartments,
		filteredDepartments: gameDepartments ?? [],
		showSupply,
		viewOnMap,
		heading,
		expandButtonRef,
		panelRef,
		sort,
		setSort,
		dateRange: `${date.format(new Date(`${view.start}T00:00:00Z`))} – ${date.format(new Date(`${view.end}T00:00:00Z`))}`,
		isLoading: showSupply && query.isPending,
		isError: showSupply && query.isError,
		retry: () => void query.refetch(),
		isEmpty: view.rows.length === 0 || view.total === 0,
		incomplete:
			view.total === null ||
			view.rows.some(
				(row) => row.value === null || (segment === "department" && row.departments === null),
			),
	};
}
