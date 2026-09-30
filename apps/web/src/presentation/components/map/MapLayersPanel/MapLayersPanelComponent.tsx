"use client";

import Image from "next/image";
import { useMapLayersPanelRules } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.rules";
import type { LayerSwitchProps } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";

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
		finishCardMotion,
		isCardShown,
		isExpanded,
		messages,
		showFacilities,
		toggleExpanded,
		toggleFacilities,
	} = useMapLayersPanelRules();
	const collapseLabel = {
		[`${!isExpanded}`]: messages.layersExpand,
		[`${isExpanded}`]: messages.layersCollapse,
	}.true as string;
	const toggleSurface = {
		[`${!isExpanded}`]: "bg-card",
		[`${isExpanded}`]: "bg-accent",
	}.true as string;
	const cardMotionClass = {
		resting: "",
		enter: "layers-card-in",
		exit: "layers-card-out",
	}[cardMotion];
	return (
		<aside
			aria-label={messages.layersBrand}
			className="fixed top-[20px] left-[20px] z-50 flex w-max flex-col items-stretch gap-[4px]"
		>
			<div className="flex items-stretch overflow-hidden rounded-[8px] border border-border bg-card py-[2px] shadow-md">
				<div className="flex items-center gap-[4px] px-[8px] py-[4px]">
					<Image src="/images/plei-logo.svg" alt="" width={20} height={20} />
					<p className="text-[12px] leading-none font-semibold whitespace-nowrap text-card-foreground">
						{messages.layersBrand}
					</p>
				</div>
				<button
					type="button"
					aria-expanded={isExpanded}
					aria-label={collapseLabel}
					onClick={toggleExpanded}
					className={`-my-[2px] flex w-[32px] shrink-0 items-center justify-center self-stretch border-l border-border hover:bg-accent active:bg-accent ${toggleSurface}`}
				>
					<Image src="/images/map-layers/settings-2.svg" alt="" width={16} height={16} />
				</button>
			</div>
			{isCardShown && (
				<div
					onAnimationEnd={finishCardMotion}
					className={`flex w-full flex-col gap-1 overflow-hidden rounded-[10px] border border-border bg-card px-3 pt-1 pb-3 shadow-md ${cardMotionClass}`}
				>
					<p className="py-1.5 text-[10px] leading-4 font-medium text-muted-foreground">
						{messages.layersHeading}
					</p>
					<div className="flex w-full items-center justify-between gap-3">
						<div className="flex items-center gap-1">
							<Image src="/images/map-layers/map-pin.svg" alt="" width={16} height={16} />
							<p className="text-[12px] leading-none font-medium text-foreground">
								{messages.layersFacilities}
							</p>
						</div>
						<LayerSwitch
							checked={showFacilities}
							label={messages.layersFacilities}
							onToggle={toggleFacilities}
						/>
					</div>
				</div>
			)}
		</aside>
	);
}
