"use client";

import type {
	DrillDownMeasure,
	DrillDownSegment,
	DrillDownSlice,
	MetricDrillDownRow,
} from "@market-health-map/core/application";
import {
	DRILL_DOWN_DEPARTMENTS,
	makeGetMetricDrillDown,
} from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { type AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
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

const getMetricDrillDown = makeGetMetricDrillDown();

export function useMetricDrillDownPanelRules({
	isOpen,
	isClosing,
	onClosed,
	onClose,
	triggerRef,
}: MetricDrillDownPanelProps) {
	const { scope, period, setMapNavigation, setMetricFocus } = useMapScope();
	const { messages, locale } = useMessages();
	const query = useFacilityListAll();
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
	const view = useMemo(
		() =>
			getMetricDrillDown({
				facilities: showSupply ? (query.data ?? []) : [],
				gameDepartments,
				period,
				...selection,
				marketId: scope.kind === "market" ? scope.id : undefined,
				facilityId: scope.kind === "facility" ? scope.id : undefined,
				now: new Date(),
			}),
		[period, query.data, scope, selection, gameDepartments, showSupply],
	);
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
		const facilityIds = (query.data ?? [])
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
	}, [focusedRow, query.data, scope, selection.slice, focus?.department, setMetricFocus]);
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
	const canSegment = selection.measure === "games" && selection.slice !== "department";
	const segment = canSegment ? selection.segment : "none";
	const number = new Intl.NumberFormat(locale);
	const date = new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
	const formatValue = (value: number | null) =>
		value === null ? messages.drillDown.unavailable : number.format(value);
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
				bars: selectedDepartments.map((department) => ({
					id: department,
					department,
					label: `${rowName(row)} · ${departmentNames[department]}: ${formatValue(counts[department])}`,
					value: counts[department],
					height: (counts[department] / max) * 100,
				})),
			};
		}
		return {
			...row,
			bars: [
				{
					id: "total",
					label: `${rowName(row)}: ${formatValue(row.value)}`,
					value: row.value,
					height: (row.value / max) * 100,
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
				measure === "active-facilities" && current.slice === "department"
					? "market"
					: current.slice,
			segment: measure === "active-facilities" ? "none" : current.segment,
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
	function viewOnMap(row: MetricDrillDownRow) {
		const facilityIds = (query.data ?? [])
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
	return {
		messages: messages.drillDown,
		selection,
		segment,
		canSegment,
		setMeasure,
		setSlice,
		setSegment,
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
		isLoading: query.isPending,
		isError: query.isError,
		retry: () => void query.refetch(),
		isEmpty: view.rows.length === 0 || view.total === 0,
		incomplete:
			view.total === null ||
			view.rows.some(
				(row) => row.value === null || (segment === "department" && row.departments === null),
			),
	};
}
