"use client";

import { AppSessionFilters } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent";
import { GameDepartmentFilter } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent";
import { useMapLayersPanelRules } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.rules";
import type { LayerSwitchProps } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";
import { MapMetricSelect } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent";
import {
	MAP_MENU_GROUP_LABEL_CLASS,
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

export function MapLayersPanel() {
	const {
		showDemographics,
		isDemandOpen,
		demandRootRef,
		demandTriggerRef,
		demandListId,
		toggleDemand,
		demandKeys,
		demandMetric,
		selectDemandMetric,
		showGamesSelector,
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
		showSessions,
		toggleExpanded,
		toggleActiveFacilities,
		toggleInactiveFacilities,
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

	if (!isOnMap) return null;

	return (
		<aside
			ref={rootRef}
			onKeyDown={closeOnEscape}
			aria-label={messages.layersHeading}
			className="fixed top-[var(--map-frame)] left-[calc(50%+min(12rem,50%-12rem)+4px)] z-50 w-[32px]"
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
					className={`${MAP_MENU_SURFACE_CLASS} right-0 ${showDemographics || showGamesSelector ? "w-[280px] max-w-[calc(100vw-32px)] max-sm:fixed max-sm:top-[calc(var(--map-frame)+36px)] max-sm:left-[var(--map-frame)] max-sm:right-[var(--map-frame)] max-sm:mt-0 max-sm:w-auto" : "w-max"} max-h-[calc(100dvh-100px)] overflow-y-auto ${cardMotionClass}`}
				>
					<h2 className={`px-2 pt-1.5 pb-1 ${MAP_MENU_GROUP_LABEL_CLASS}`}>
						{messages.layersDemand}
					</h2>
					<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5">
						{showDemographics ? (
							<div ref={demandRootRef} className="min-w-0 flex-1">
								<button
									ref={demandTriggerRef}
									type="button"
									aria-label={messages.layersDemand}
									aria-haspopup="listbox"
									aria-expanded={isDemandOpen}
									aria-controls={isDemandOpen ? demandListId : undefined}
									onClick={toggleDemand}
									onKeyDown={demandKeys}
									className={`flex w-full cursor-pointer items-center justify-between gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-foreground ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
								>
									<span>
										{demandMetric === "registrations"
											? messages.layersRegistrations
											: messages.layersSessions}
									</span>
									<svg
										aria-hidden="true"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										className={`size-3 shrink-0 text-muted-foreground transition-transform ${isDemandOpen ? "rotate-180" : ""}`}
									>
										<path d="m4 6 4 4 4-4" />
									</svg>
								</button>
								{isDemandOpen && (
									<div
										id={demandListId}
										role="listbox"
										onKeyDown={demandKeys}
										aria-label={messages.layersDemand}
										className="map-glass mt-2 rounded-[var(--map-radius)] border border-border p-1 shadow-[var(--map-shadow)]"
									>
										{(["sessions", "registrations"] as const).map((metric) => (
											<button
												key={metric}
												type="button"
												role="option"
												aria-selected={demandMetric === metric}
												onClick={() => selectDemandMetric(metric)}
												className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
											>
												{metric === "registrations"
													? messages.layersRegistrations
													: messages.layersSessions}
												<span aria-hidden="true">{demandMetric === metric ? "✓" : ""}</span>
											</button>
										))}
									</div>
								)}
							</div>
						) : (
							<p className={MAP_MENU_ROW_LABEL_CLASS}>{messages.layersSessions}</p>
						)}
						<LayerSwitch
							checked={showSessions}
							label={
								demandMetric === "registrations"
									? messages.layersRegistrations
									: messages.layersSessions
							}
							onToggle={toggleSessions}
						/>
					</div>
					{showDemographics && <AppSessionFilters key={resetCount} showSessions={showSessions} />}
					<h2 className={`px-2 pt-1.5 pb-1 ${MAP_MENU_GROUP_LABEL_CLASS}`}>
						{messages.layersSupply}
					</h2>
					<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5">
						{showGamesSelector ? (
							<MapMetricSelect
								key={`supply-${resetCount}`}
								label={messages.layersSupply}
								value={supplyMetric}
								onSelect={selectSupplyMetric}
								options={[
									{ value: "games", label: messages.layersGames },
									{ value: "facilities", label: messages.layersActiveFacilities },
								]}
							/>
						) : (
							<p className={MAP_MENU_ROW_LABEL_CLASS}>{messages.layersActiveFacilities}</p>
						)}
						<LayerSwitch
							checked={showActiveFacilities}
							label={
								supplyMetric === "games" ? messages.layersGames : messages.layersActiveFacilities
							}
							onToggle={toggleActiveFacilities}
						/>
					</div>
					{showGamesSelector && (
						<GameDepartmentFilter
							key={`game-departments-${resetCount}`}
							enabled={
								showActiveFacilities || (supplyMetric === "facilities" && showInactiveFacilities)
							}
						/>
					)}
					{supplyMetric === "facilities" && (
						<div className="flex w-full items-center justify-between gap-2 rounded-sm pl-5 pr-2 py-1.5">
							<p className={MAP_MENU_ROW_LABEL_CLASS}>{messages.layersInactiveFacilities}</p>
							<LayerSwitch
								checked={showInactiveFacilities}
								label={messages.layersInactiveFacilities}
								onToggle={toggleInactiveFacilities}
							/>
						</div>
					)}
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
				</div>
			)}
		</aside>
	);
}
