"use client";

import Image from "next/image";
import { useMapLayersPanelRules } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.rules";
import type { LayerSwitchProps } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";
import { MAP_MENU_SURFACE_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

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
		cardMotion,
		closeOnEscape,
		finishCardMotion,
		isCardShown,
		isExpanded,
		isOnMap,
		layersBadge,
		layersOnLabel,
		messages,
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
			aria-label={messages.layersHeading}
			className="fixed top-[var(--map-frame)] left-[calc(50%+min(12rem,50%-12rem)+4px)] z-50 w-[32px]"
		>
			<button
				type="button"
				aria-expanded={isExpanded}
				aria-label={collapseLabel}
				onClick={toggleExpanded}
				onKeyDown={closeOnEscape}
				aria-describedby={layersBadge ? "layers-on-status" : undefined}
				className="map-icon-button map-glass pointer-events-auto relative flex size-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-map-icon shadow-[var(--map-shadow)] outline-none"
			>
				<Image src="/images/map-layers/layers.svg" alt="" width={16} height={16} />
				{layersBadge && (
					<span
						data-testid="layers-badge"
						aria-hidden="true"
						className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-pleiful-pitch-green-80 text-[10px] leading-none font-semibold text-white shadow-sm"
					>
						{layersBadge}
					</span>
				)}
			</button>
			{layersBadge && (
				<span id="layers-on-status" className="sr-only">
					{layersOnLabel}
				</span>
			)}
			{isCardShown && (
				<div
					onAnimationEnd={finishCardMotion}
					className={`${MAP_MENU_SURFACE_CLASS} right-0 w-max ${cardMotionClass}`}
				>
					<p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
						{messages.layersHeading}
					</p>
					<h2 className="px-2 pt-1.5 pb-1 text-[10px] font-medium text-muted-foreground uppercase">
						{messages.layersDemand}
					</h2>
					<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm">
						<p>{messages.layersSessions}</p>
						<LayerSwitch
							checked={showSessions}
							label={messages.layersSessions}
							onToggle={toggleSessions}
						/>
					</div>
					<h2 className="px-2 pt-1.5 pb-1 text-[10px] font-medium text-muted-foreground uppercase">
						{messages.layersSupply}
					</h2>
					<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm">
						<p>{messages.layersActiveFacilities}</p>
						<LayerSwitch
							checked={showActiveFacilities}
							label={messages.layersActiveFacilities}
							onToggle={toggleActiveFacilities}
						/>
					</div>
					<div className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm">
						<p>{messages.layersInactiveFacilities}</p>
						<LayerSwitch
							checked={showInactiveFacilities}
							label={messages.layersInactiveFacilities}
							onToggle={toggleInactiveFacilities}
						/>
					</div>
				</div>
			)}
		</aside>
	);
}
