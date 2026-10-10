"use client";

import type {
	DrillDownComparison,
	DrillDownGrain,
	DrillDownMeasure,
	DrillDownRange,
	DrillDownSegment,
	DrillDownSlice,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@market-health-map/core/application";
import {
	canSegmentDrillDown,
	canSegmentDrillDownByFacility,
	canSliceDrillDownByDepartment,
	canSliceDrillDownByOrganizer,
	crossesAppTrackingSourceSwitch,
	DRILL_DOWN_DEPARTMENTS,
	isAppActivityMeasure,
} from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { classifyGamesTrend } from "@market-health-map/core/domain";
import { formatMessage } from "@market-health-map/core/i18n";
import { type AnimationEvent, useEffect, useRef, useState } from "react";
import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";
import { drillDownDatesPreference } from "@/infrastructure/cache/local-storage/drill-down-dates/drill-down-dates-preference";
import {
	DRILL_DOWN_COLORS,
	DRILL_DOWN_FACILITY_SEGMENT_LIMIT,
	DRILL_DOWN_OTHER_FACILITIES_COLOR,
	drillDownFacilityColor,
	drillDownOrganizerColor,
} from "@/presentation/components/map/ExplorePanel/ExplorePanelComponent.styles";
import type {
	DrillDownChartRow,
	DrillDownSegmentGroup,
	DrillDownSegmentLegendItem,
	DrillDownSort,
	ExplorePanelProps,
	ExploreSelection,
	MetricDrillDownFocus,
} from "@/presentation/components/map/ExplorePanel/ExplorePanelComponent.types";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityListAll } from "@/presentation/hooks/use-facility/use-facility-list-all";
import { useMetricDrillDown } from "@/presentation/hooks/use-metric/use-metric-drill-down";

function sourceSwitchPosition(rows: readonly MetricDrillDownRow[]): number | undefined {
	const index = rows.findIndex(
		(row) => row.id <= "2026-06-29" && (row.bucketEnd ?? row.id) >= "2026-06-29",
	);
	return index < 0 ? undefined : ((index + 0.5) / rows.length) * 100;
}

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

export function useExplorePanelRules({
	isOpen,
	isClosing,
	onClosed,
	onClose,
	triggerRef,
}: ExplorePanelProps) {
	const { scope, period, setMapNavigation, setMetricFocus } = useMapScope();
	const { messages, locale } = useMessages();
	const facilitiesQuery = useFacilityListAll();
	const layers = useMapLayers();
	const gameDepartments = layers?.gameDepartments;
	const showSupply = layers?.showActiveFacilities ?? true;
	const departmentKey = gameDepartments?.join(",") ?? "";
	const scopeKey = scope.kind === "all" ? "all" : `${scope.kind}:${scope.id}`;
	const [selection, setSelection] = useState<ExploreSelection>({
		measure: "games",
		slice: scope.kind === "all" ? "market" : "facility",
		segment: "none",
	});
	const [rememberedDates] = useState(() => drillDownDatesPreference.read());
	const [comparison, setComparison] = useState<DrillDownComparison>(
		() => rememberedDates?.comparison ?? (period === "week" ? "week" : "month"),
	);
	const [grain, setGrainState] = useState<DrillDownGrain>("day");
	const isTime = selection.slice === "time";
	const isAppActivity = isAppActivityMeasure(selection.measure);
	const effectiveSupply = isAppActivity || showSupply;
	const activityMarketId =
		scope.kind === "facility"
			? facilitiesQuery.data?.find((facility) => facility.id === scope.id)?.marketId
			: undefined;
	const [range, setRangeState] = useState<DrillDownRange>(
		() => rememberedDates?.range ?? rangeFromPeriod(period),
	);
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
			slice: isAppActivityMeasure(current.measure) || scope.kind === "all" ? "market" : "facility",
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
	const canSegment = canSegmentDrillDown(selection.measure, selection.slice);
	const canSegmentByFacility = canSegmentDrillDownByFacility(selection.measure, selection.slice);
	const segment = {
		none: true,
		department: canSegment,
		organizer: canSegment,
		facility: canSegmentByFacility,
	}[selection.segment]
		? selection.segment
		: "none";
	const isGroupSegment = segment === "organizer" || segment === "facility";
	const segmentGroupsOf = (row: MetricDrillDownRow): DrillDownSegmentGroup[] | null | undefined =>
		segment === "facility" ? row.facilities : row.organizers;
	const query = useMetricDrillDown({
		measure: selection.measure,
		range,
		slice: selection.slice,
		segment,
		grain: isTime ? grain : "range",
		comparison,
		marketId: {
			[`${isAppActivity}`]: activityMarketId,
			[`${scope.kind === "market"}`]: scope.kind === "market" ? scope.id : undefined,
		}.true,
		facilityId: !isAppActivity && scope.kind === "facility" ? scope.id : undefined,
		departments: isAppActivity ? [] : gameDepartments,
		enabled:
			isOpen &&
			effectiveSupply &&
			(!isAppActivity || scope.kind !== "facility" || !!activityMarketId),
	});
	const view = effectiveSupply ? (query.data ?? EMPTY_VIEW) : EMPTY_VIEW;
	const focusedRow = view.rows.find((row) => row.id === focus?.rowId);
	const focusedOrganizer =
		segment === "organizer"
			? focusedRow?.organizers?.find((organizer) => organizer.id === focus?.groupId)
			: undefined;
	const focusedFacility =
		segment === "facility"
			? focusedRow?.facilities?.find((facility) => facility.id === focus?.groupId)
			: undefined;
	const focusedGroup: DrillDownSegmentGroup | undefined = focusedOrganizer ?? focusedFacility;
	const focusedValue = {
		true: focusedRow?.value ?? null,
		[`${!!focus?.groupId}`]: focusedGroup?.value ?? null,
		[`${!!focus?.department}`]: focusedRow?.departments?.[focus?.department ?? "magic"] ?? null,
	}.true;
	const hasFocus = !!focusedRow;
	useEffect(() => {
		if (!focusedRow || isAppActivity) {
			setMetricFocus(null);
			return;
		}
		const groupFacilities = focusedFacility
			? [focusedFacility.id]
			: (focusedOrganizer?.facilityIds ?? focusedRow.facilityIds ?? []);
		const timeFacilities = {
			true: focusedRow.facilityIds ?? [],
			[`${!!focus?.department}`]:
				focusedRow.departmentFacilityIds?.[focus?.department ?? "magic"] ??
				focusedRow.facilityIds ??
				[],
			[`${!!focus?.groupId}`]: groupFacilities,
		}.true;
		const listedFacilities = (facilitiesQuery.data ?? [])
			.filter(
				(facility) =>
					(scope.kind !== "market" || facility.marketId === scope.id) &&
					(isAppActivity || scope.kind !== "facility" || facility.id === scope.id) &&
					(selection.slice !== "market" || facility.marketId === focusedRow.id) &&
					(selection.slice !== "facility" || facility.id === focusedRow.id),
			)
			.map((facility) => facility.id);
		const facilityIds = {
			true: listedFacilities,
			[`${isTime}`]: timeFacilities,
			[`${selection.slice === "organizer" || !!focus?.groupId}`]: groupFacilities,
		}.true;
		const department = {
			true: focus?.department,
			[`${selection.slice === "department"}`]: focusedRow.id as GameDepartment,
			[`${selection.slice === "organizer" || !!focusedOrganizer}`]: "organizers" as const,
		}.true;
		setMetricFocus({ facilityIds, department });
	}, [
		focusedRow,
		focusedOrganizer,
		focusedFacility,
		facilitiesQuery.data,
		scope,
		selection.slice,
		focus?.department,
		focus?.groupId,
		setMetricFocus,
		isAppActivity,
		isTime,
	]);
	useEffect(() => () => setMetricFocus(null), [setMetricFocus]);

	useEffect(() => {
		drillDownDatesPreference.remember({ range, comparison });
	}, [comparison, range]);
	function toggleFocus(
		row: MetricDrillDownRow,
		part?: { department?: GameDepartment; groupId?: string },
	) {
		setFocus((current) =>
			current?.rowId === row.id &&
			current.department === part?.department &&
			current.groupId === part?.groupId
				? null
				: { rowId: row.id, department: part?.department, groupId: part?.groupId },
		);
	}
	const isSelected = (
		row: MetricDrillDownRow,
		part?: { department?: GameDepartment; groupId?: string },
	) =>
		focus?.rowId === row.id &&
		(part === undefined ||
			(focus.department === part.department && focus.groupId === part.groupId));
	const number = new Intl.NumberFormat(locale);
	const rate = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});
	function changeValue(current: number | null, previous: number | null | undefined) {
		if (current === null || previous == null) return null;
		if (view.kind === "rate") return current - previous;
		return previous === 0 ? null : ((current - previous) / previous) * 100;
	}
	function changeDisplay(current: number | null, previous: number | null | undefined) {
		if (current === null || previous == null)
			return {
				label: messages.drillDown.unavailable,
				countLabel: undefined,
				className: "text-muted-foreground",
				color: undefined,
			};
		const level =
			view.kind === "rate"
				? current === previous
					? "stable"
					: current > previous
						? "up"
						: "down"
				: classifyGamesTrend(current, previous);
		const className = {
			up: "text-pleiful-pitch-green-50",
			down: "",
			stable: "text-muted-foreground",
		}[level];
		const value = changeValue(current, previous);
		const arrow = { up: "↑", down: "↓", stable: "→" }[level];
		const formattedChange =
			value === null
				? messages.drillDown.changeNew
				: `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(value))}${view.kind === "rate" ? " pts" : "%"}`;
		const label =
			level === "stable" ? messages.drillDown.changeStable : `${arrow} ${formattedChange}`;
		const countLabel =
			level === "stable"
				? `(+${number.format(0)})`
				: view.kind === "rate"
					? undefined
					: `(${current > previous ? "+" : "-"}${number.format(Math.abs(current - previous))})`;
		return {
			label,
			countLabel,
			className,
			color: level === "down" ? PLEIFUL_COLORS.negative[50] : undefined,
		};
	}
	const date = new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
	const measureLabels = {
		"app-sessions": messages.drillDown.appSessions,
		registrations: messages.drillDown.registrations,
		"unique-users": messages.drillDown.uniqueUsers,
		games: messages.drillDown.games,
		"avg-daily-games": messages.drillDown.avgDailyGames,
		"active-organizers": messages.drillDown.activeOrganizers,
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
	const monthDate = new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		timeZone: "UTC",
	});
	function bucketLabel(row: MetricDrillDownRow) {
		const day = grain === "week" ? (row.bucketEnd ?? row.id) : row.id;
		const label = (grain === "month" ? monthDate : date).format(new Date(`${day}T00:00:00Z`));
		return `${label}${row.partial ? ` · ${messages.drillDown.partial}` : ""}`;
	}
	const rowName = (row: MetricDrillDownRow) =>
		selection.slice === "department"
			? departmentNames[row.id as GameDepartment]
			: isTime
				? bucketLabel(row)
				: row.name;
	const availableRows = view.rows.filter(
		(row) => isTime || view.kind === "rate" || row.value !== 0 || row.previousValue !== 0,
	);
	const visibleRows = hasFocus
		? [
				{
					...focusedRow,
					...(focus?.department ? focusedRow.departmentParts?.[focus.department] : {}),
					...(focusedGroup
						? {
								numerator: focusedGroup.numerator,
								denominator: focusedGroup.denominator,
								dataErrors: focusedGroup.dataErrors,
							}
						: {}),
					value: focusedValue,
					previousValue: {
						true: focusedRow.previousValue,
						[`${!!focus?.department}`]:
							focusedRow.previousDepartments?.[focus?.department ?? "magic"] ?? null,
						[`${!!focusedGroup}`]: focusedGroup?.previousValue ?? null,
					}.true,
				},
			]
		: availableRows;
	const rows = [...visibleRows].sort((a, b) => {
		if (sort === "name-asc") return rowName(a).localeCompare(rowName(b), locale);
		if (sort === "name-desc") return rowName(b).localeCompare(rowName(a), locale);
		if (!isTime && sort.startsWith("change")) {
			const left = changeValue(a.value, a.previousValue);
			const right = changeValue(b.value, b.previousValue);
			if (left === null && right === null) return rowName(a).localeCompare(rowName(b), locale);
			if (left === null) return 1;
			if (right === null) return -1;
			return (
				(sort === "change-asc" ? left - right : right - left) ||
				rowName(a).localeCompare(rowName(b), locale)
			);
		}
		if (a.value === null && b.value === null) return 0;
		if (a.value === null) return 1;
		if (b.value === null) return -1;
		const delta = a.value - b.value;
		return (sort === "count-asc" ? delta : -delta) || rowName(a).localeCompare(rowName(b), locale);
	});
	const topRows = isTime
		? [...visibleRows].sort((a, b) => a.id.localeCompare(b.id))
		: [...visibleRows].sort((a, b) => (b.value ?? -1) - (a.value ?? -1)).slice(0, 10);
	function selectedBarTotal(row: MetricDrillDownRow) {
		if (isGroupSegment)
			return (segmentGroupsOf(row) ?? []).reduce((sum, group) => sum + (group.value ?? 0), 0);
		return Object.values(row.departments ?? {}).reduce<number>(
			(sum, value) => sum + (value ?? 0),
			0,
		);
	}
	const smallestStep = selection.measure === "avg-daily-games" ? 0.1 : 1;
	const largest = Math.max(
		smallestStep,
		...topRows.map((row) => (segment === "none" ? (row.value ?? 0) : selectedBarTotal(row))),
	);
	const magnitude = 10 ** Math.floor(Math.log10(largest / 5));
	const step = Math.max(smallestStep, Math.ceil(largest / magnitude / 5) * magnitude);
	const max = Math.ceil(largest / step) * step;
	const ticks = Array.from({ length: Math.ceil(max / step) + 1 }, (_, index) => index * step);

	const appliedDepartments = gameDepartments?.length ? gameDepartments : DRILL_DOWN_DEPARTMENTS;
	const selectedDepartments =
		hasFocus && focus?.department ? [focus.department] : appliedDepartments;
	const segmentLegend = (() => {
		const byId = new Map<string, DrillDownSegmentLegendItem>();
		for (const row of availableRows) {
			for (const group of segmentGroupsOf(row) ?? []) {
				const current = byId.get(group.id) ?? { id: group.id, name: group.name, value: 0 };
				current.value += group.value ?? 0;
				byId.set(group.id, current);
			}
		}
		return [...byId.values()].sort(
			(left, right) => right.value - left.value || left.name.localeCompare(right.name, locale),
		);
	})();
	const segmentColor = (id: string) => {
		const index = segmentLegend.findIndex((group) => group.id === id);
		return segment === "facility" ? drillDownFacilityColor(index) : drillDownOrganizerColor(index);
	};
	const hasOtherFacilities =
		segment === "facility" && segmentLegend.length > DRILL_DOWN_FACILITY_SEGMENT_LIMIT;
	const focusedLegend =
		hasFocus && focus?.groupId
			? segmentLegend.filter((group) => group.id === focus.groupId)
			: undefined;
	const segmentColumns =
		focusedLegend ??
		(segment === "facility"
			? segmentLegend.slice(0, DRILL_DOWN_FACILITY_SEGMENT_LIMIT)
			: segmentLegend);
	const segmentBars = focusedLegend ?? segmentLegend;
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
								color: DRILL_DOWN_COLORS[department],
								label: [
									`${rowName(row)} · ${departmentNames[department]}: ${formatValue(value)}`,
									rateParts(row.departmentParts?.[department] ?? {}),
								]
									.filter(Boolean)
									.join(" · "),
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
		if (isGroupSegment) {
			const groups = segmentGroupsOf(row);
			if (groups == null) return { ...row, bars: [] };
			return {
				...row,
				bars: segmentBars
					.flatMap((legend) => {
						const group = groups.find((item) => item.id === legend.id);
						const value = group?.value;
						if (value == null) return [];
						return [
							{
								id: legend.id,
								groupId: legend.id,
								color: segmentColor(legend.id),
								label: [
									`${rowName(row)} · ${legend.name}: ${formatValue(value)}`,
									rateParts(group ?? {}),
								]
									.filter(Boolean)
									.join(" · "),
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
					color: DRILL_DOWN_COLORS.organizers,
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
				(isAppActivityMeasure(measure) && current.slice !== "time") ||
				(!canSliceDrillDownByDepartment(measure) && current.slice === "department")
					? "market"
					: current.slice,
			segment:
				isAppActivityMeasure(measure) ||
				(current.segment !== "facility" && !canSliceDrillDownByDepartment(measure))
					? "none"
					: current.segment,
		}));
	}
	function setSlice(slice: DrillDownSlice) {
		setFocus(null);
		setSelection((current) => {
			const keepsSegment =
				current.segment === "facility"
					? slice !== "facility"
					: slice !== "department" && slice !== "organizer";
			return { ...current, slice, segment: keepsSegment ? current.segment : "none" };
		});
	}
	function setSegment(next: DrillDownSegment) {
		setFocus(null);
		setSelection((current) => ({ ...current, segment: next }));
	}
	function setSliceValue(value: string) {
		if (value.startsWith("time:")) {
			setGrainState(value.slice(5) as DrillDownGrain);
			setSlice("time");
		} else setSlice(value as DrillDownSlice);
	}
	function setRange(next: DrillDownRange) {
		setFocus(null);
		setRangeState(next);
	}
	function viewOnMap(row: MetricDrillDownRow) {
		const isMarketRow =
			selection.slice === "market" &&
			(facilitiesQuery.data ?? []).some((facility) => facility.marketId === row.id);
		if (isMarketRow) {
			setMapNavigation({ kind: "market", id: row.id, name: row.name });
			return;
		}
		const listed = (facilitiesQuery.data ?? [])
			.filter(
				(facility) =>
					(scope.kind !== "market" || facility.marketId === scope.id) &&
					(isAppActivity || scope.kind !== "facility" || facility.id === scope.id) &&
					(selection.slice === "market" ? facility.marketId === row.id : facility.id === row.id),
			)
			.map((facility) => facility.id);
		const facilityIds = {
			true: listed,
			[`${selection.slice === "organizer"}`]: row.facilityIds ?? [],
		}.true;
		setMapNavigation({ kind: "metric-focus", facilityIds });
	}

	let heading = scope.kind === "all" ? messages.drillDown.allMarkets : scope.name;
	if (isAppActivity && scope.kind === "facility") heading = scope.marketName;
	const headlineSource = {
		true: focusedRow ?? view,
		[`${!!focus?.department}`]: focusedRow?.departmentParts?.[focus?.department ?? "magic"] ?? {
			numerator: undefined,
			denominator: undefined,
			dataErrors: undefined,
		},
		[`${!!focusedGroup}`]: focusedGroup ?? view,
	}.true;
	const headlineTemplate = headlinePartsTemplates[selection.measure];
	const headlineParts =
		headlineTemplate && headlineSource.numerator != null && headlineSource.denominator != null
			? formatMessage(headlineTemplate, {
					numerator: number.format(headlineSource.numerator),
					denominator: number.format(headlineSource.denominator),
				})
			: undefined;
	const dataErrors = headlineSource.dataErrors ?? 0;
	const headlineChange = changeDisplay(
		hasFocus ? focusedValue : view.total,
		{
			true: view.previousTotal,
			[`${hasFocus}`]: focusedRow?.previousValue,
			[`${hasFocus && !!focus?.department}`]:
				focusedRow?.previousDepartments?.[focus?.department ?? "magic"],
			[`${hasFocus && !!focusedGroup}`]: focusedGroup?.previousValue,
		}.true,
	);
	return {
		comparison,
		setComparison,
		changeDisplay,
		headlineChange,
		comparisonLabel: {
			week: "WoW",
			month: "MoM",
			year: "YoY",
			"previous-period": messages.drillDown.compare,
		}[comparison],
		comparisonHelp: `${{ week: messages.drillDown.compareWeek, month: messages.drillDown.compareMonth, year: messages.drillDown.compareYear, "previous-period": messages.drillDown.compare }[comparison]}. ${messages.drillDown.compareHelp}`,
		messages: messages.drillDown,
		measureLabel: measureLabels[selection.measure],
		valueLabel: view.kind === "rate" ? messages.drillDown.rate : messages.drillDown.value,
		selection,
		isTime,
		grain,
		sliceValue: isTime ? `time:${grain}` : selection.slice,
		setSliceValue,
		range,
		segment,
		canSegment,
		canSegmentByFacility,
		isGroupSegment,
		canSliceByDepartment: canSliceDrillDownByDepartment(selection.measure),
		canSliceByOrganizer: canSliceDrillDownByOrganizer(selection.measure),
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
		chartTruncated: !isTime && !hasFocus && availableRows.length > 10,
		headlineValue: hasFocus ? focusedValue : view.total,
		headlineParts,
		dataErrorsMessage:
			dataErrors > 0
				? formatMessage(messages.drillDown.rosterDataErrors, { count: number.format(dataErrors) })
				: undefined,
		showReviewsLag: selection.measure === "incident-games-rate",
		rateParts,
		focusLabel: hasFocus
			? `${rowName(focusedRow)}${
					{
						true: "",
						[`${!!focus?.department}`]: ` · ${departmentNames[focus?.department ?? "magic"]}`,
						[`${!!focusedGroup}`]: ` · ${focusedGroup?.name ?? ""}`,
					}.true
				}`
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
		segmentColumns,
		segmentColor,
		segmentGroupsOf,
		otherFacilitiesColor: hasOtherFacilities ? DRILL_DOWN_OTHER_FACILITIES_COLOR : undefined,
		facilitySegmentNote: hasOtherFacilities
			? formatMessage(messages.drillDown.facilitySegmentTop, {
					count: number.format(DRILL_DOWN_FACILITY_SEGMENT_LIMIT),
				})
			: undefined,
		filteredDepartments: isAppActivity ? [] : (gameDepartments ?? []),
		isAppActivity,
		sourceSwitchPosition: sourceSwitchPosition(chartRows),
		showSourceSwitch:
			isAppActivity &&
			selection.measure !== "registrations" &&
			(crossesAppTrackingSourceSwitch(view.start, view.end) ||
				(!!view.previousStart &&
					!!view.previousEnd &&
					crossesAppTrackingSourceSwitch(view.previousStart, view.previousEnd))),
		showSupply: effectiveSupply,
		viewOnMap,
		heading,
		expandButtonRef,
		panelRef,
		sort,
		setSort,
		dateRange:
			view.start > view.end
				? messages.drillDown.noCompletedBuckets
				: `${date.format(new Date(`${view.start}T00:00:00Z`))} – ${date.format(new Date(`${view.end}T00:00:00Z`))}`,
		isLoading: effectiveSupply && query.isPending,
		isError: effectiveSupply && query.isError,
		retry: () => void query.refetch(),
		isEmpty: view.rows.length === 0 || (!isTime && view.total === 0),
		incomplete:
			view.total === null ||
			view.rows.some(
				(row) =>
					row.value === null ||
					(segment === "department" && row.departments === null) ||
					(isGroupSegment && segmentGroupsOf(row) == null),
			),
	};
}
