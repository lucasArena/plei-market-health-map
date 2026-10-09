"use client";

import {
	AppSessionFilters,
	SessionFilterAdd,
	SessionFilterApply,
	SessionFilterChips,
} from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent";
import {
	GameDepartmentFilterAdd,
	GameDepartmentFilterApply,
	GameDepartmentFilterChips,
	GameDepartmentFilters,
} from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent";
import { MAP_FILTER_METRIC_ROW_GRID_CLASS } from "@/presentation/components/map/MapFilterAdd/MapFilterAddComponent";
import { useMapLayersPanelRules } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.rules";
import type {
	LayerMetricRadioProps,
	LayerSwitchProps,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";
import {
	MAP_MENU_ROW_LABEL_CLASS,
	MAP_MENU_SURFACE_CLASS,
	MAP_SEARCH_OPTION_HOVER_CLASS,
} from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

function LayerSwitch({ checked, label, onToggle }: Readonly<LayerSwitchProps>) {
	const track = {
		[`${!checked}`]: "bg-[#e5e5e5]",
		[`${checked}`]: "bg-pleiful-pitch-green-80",
	}.true as string;
	const thumbShift = {
		[`${!checked}`]: "translate-x-0",
		[`${checked}`]: "translate-x-[9px]",
	}.true as string;

	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={onToggle}
			className={`box-border flex h-[13px] w-[22px] shrink-0 cursor-pointer items-center rounded-full border border-transparent p-[1px] leading-none transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${track}`}
		>
			<span
				className={`pointer-events-none block size-[9px] shrink-0 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${thumbShift}`}
			/>
		</button>
	);
}

function MetricRadio({ label, name, value, selected, onSelect }: Readonly<LayerMetricRadioProps>) {
	const ring = {
		[`${!selected}`]: "border-muted-foreground/45",
		[`${selected}`]: "border-pleiful-pitch-green-80",
	}.true as string;

	return (
		<label
			className={`${MAP_FILTER_METRIC_ROW_GRID_CLASS} cursor-pointer rounded-md px-2 py-1.5 text-left text-xs hover:bg-foreground/[0.07] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/20`}
		>
			<input
				type="radio"
				name={name}
				value={value}
				checked={selected}
				onChange={onSelect}
				className="sr-only"
			/>
			<span className="min-w-0 truncate">{label}</span>
			<span
				aria-hidden="true"
				className={`relative box-border size-4 shrink-0 rounded-full border bg-background ${ring}`}
			>
				{selected && (
					<span className="absolute inset-[3px] rounded-full bg-pleiful-pitch-green-80" />
				)}
			</span>
		</label>
	);
}

export function MapLayersPanel() {
	const {
		demandGroupRef,
		demandKeys,
		demandMetric,
		selectDemandMetric,
		supplyGroupRef,
		supplyKeys,
		supplyMetric,
		selectSupplyMetric,
		cardMotion,
		closeOnEscape,
		finishCardMotion,
		isCardShown,
		isExpanded,
		isCustomized,
		isOnMap,
		messages,
		resetCount,
		resetLayers,
		rootRef,
		showActiveFacilities,
		showInactiveFacilities,
		showGamesTrend,
		showSessions,
		toggleExpanded,
		closePanel,
		toggleActiveFacilities,
		toggleInactiveFacilities,
		toggleGamesTrend,
		toggleSessions,
	} = useMapLayersPanelRules();
	const collapseLabel = {
		[`${!isExpanded}`]: messages.layersExpand,
		[`${isExpanded}`]: messages.layersCollapse,
	}.true as string;
	const cardMotionClass = {
		hidden: "",
		enter: "search-results-in",
		shown: "",
		exit: "search-results-out",
	}[cardMotion];
	const demandSwitchLabel = {
		[`${true}`]: messages.layersSessions,
		[`${demandMetric === "registrations"}`]: messages.layersRegistrations,
	}.true as string;
	const supplySwitchLabel = {
		[`${true}`]: messages.layersActiveFacilities,
		[`${supplyMetric === "games"}`]: messages.layersGames,
	}.true as string;

	if (!isOnMap) return null;

	const menu = (
		<>
			<section aria-label={messages.layersDemand} className="pb-3">
				<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5">
					<p className={MAP_MENU_ROW_LABEL_CLASS}>{messages.layersDemand}</p>
					<LayerSwitch checked={showSessions} label={demandSwitchLabel} onToggle={toggleSessions} />
				</div>
				{showSessions && (
					<div className="mt-0.5 ml-3 border-l border-border pl-1">
						<div
							ref={demandGroupRef}
							role="radiogroup"
							aria-label={messages.layersDemand}
							onKeyDown={demandKeys}
							className="py-0.5"
						>
							{(
								[
									["sessions", messages.layersSessions],
									["registrations", messages.layersRegistrations],
								] as const
							).map(([metric, label]) => (
								<MetricRadio
									key={metric}
									name="map-layers-demand-metric"
									value={metric}
									label={label}
									selected={demandMetric === metric}
									onSelect={() => selectDemandMetric(metric)}
								/>
							))}
						</div>
						<SessionFilterChips />
						<SessionFilterAdd />
					</div>
				)}
			</section>
			<div className="mx-2 my-1 border-t border-border" />
			<section aria-label={messages.layersSupply} className="pb-3">
				<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5">
					<p className={MAP_MENU_ROW_LABEL_CLASS}>{messages.layersSupply}</p>
					<LayerSwitch
						checked={showActiveFacilities}
						label={supplySwitchLabel}
						onToggle={toggleActiveFacilities}
					/>
				</div>
				{showActiveFacilities && (
					<div className="mt-0.5 ml-3 border-l border-border pl-1">
						<div
							ref={supplyGroupRef}
							role="radiogroup"
							aria-label={messages.layersSupply}
							onKeyDown={supplyKeys}
							className="py-0.5"
						>
							{(
								[
									["games", messages.layersGames],
									["facilities", messages.layersActiveFacilities],
								] as const
							).map(([metric, label]) => (
								<MetricRadio
									key={metric}
									name="map-layers-supply-metric"
									value={metric}
									label={label}
									selected={supplyMetric === metric}
									onSelect={() => selectSupplyMetric(metric)}
								/>
							))}
						</div>
						<GameDepartmentFilterChips />
						<GameDepartmentFilterAdd />
						{supplyMetric === "games" && (
							<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5">
								<p className="text-xs">{messages.trend.toggle}</p>
								<LayerSwitch
									checked={showGamesTrend}
									label={messages.trend.toggle}
									onToggle={toggleGamesTrend}
								/>
							</div>
						)}
						{supplyMetric === "facilities" && (
							<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5">
								<p className="text-xs">{messages.layersInactiveFacilities}</p>
								<LayerSwitch
									checked={showInactiveFacilities}
									label={messages.layersInactiveFacilities}
									onToggle={toggleInactiveFacilities}
								/>
							</div>
						)}
					</div>
				)}
			</section>
			<SessionFilterApply />
			<GameDepartmentFilterApply />
			{isCustomized && (
				<div className="-mx-1 mt-1 flex justify-end border-t border-border px-1 pt-1">
					<button
						type="button"
						onClick={resetLayers}
						className={`cursor-pointer rounded-sm px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:text-foreground ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
					>
						{messages.layersReset}
					</button>
				</div>
			)}
		</>
	);

	return (
		<aside
			ref={rootRef}
			onKeyDown={closeOnEscape}
			aria-label={messages.layersHeading}
			className="fixed top-[var(--map-frame)] left-[calc(50%+min(12rem,50%-12rem)+4px)] z-50 w-[32px] max-sm:top-[calc(var(--map-frame)+40px)] max-sm:right-[var(--map-frame)] max-sm:left-auto"
		>
			<button
				type="button"
				aria-expanded={isExpanded}
				aria-label={collapseLabel}
				onClick={toggleExpanded}
				onKeyDown={closeOnEscape}
				data-active={isCustomized}
				className={`map-icon-button map-glass pointer-events-auto relative flex size-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-map-icon shadow-[var(--map-shadow)] outline-none`}
			>
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.33"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className="size-4"
				>
					<path d="M13.333 4.667h-6M9.333 11.333h-6" />
					<circle cx="11.333" cy="11.333" r="2" />
					<circle cx="4.667" cy="4.667" r="2" />
				</svg>
				{isCustomized && (
					<span
						data-testid="layers-indicator"
						aria-hidden="true"
						className="absolute top-0 right-0 size-2 rounded-full bg-pleiful-pitch-green-50 ring-2 ring-background"
					/>
				)}
			</button>
			{isCardShown && (
				<div
					onAnimationEnd={finishCardMotion}
					className={`${MAP_MENU_SURFACE_CLASS} right-0 w-[280px] max-w-[calc(100vw-32px)] max-sm:fixed max-sm:top-[calc(var(--map-frame)+76px)] max-sm:left-[var(--map-frame)] max-sm:right-[var(--map-frame)] max-sm:mt-0 max-sm:w-auto max-h-[calc(100dvh-100px)] overflow-y-auto ${cardMotionClass}`}
				>
					<AppSessionFilters showSessions={showSessions} onApplied={closePanel}>
						<GameDepartmentFilters
							key={`game-departments-${resetCount}`}
							enabled={showActiveFacilities}
						>
							{menu}
						</GameDepartmentFilters>
					</AppSessionFilters>
				</div>
			)}
		</aside>
	);
}
