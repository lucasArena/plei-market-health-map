"use client";
import { useMapMetricSelectRules } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.rules";
import type { MapMetricSelectProps } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.types";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";
export function MapMetricSelect(props: Readonly<MapMetricSelectProps>) {
	const { isOpen, rootRef, triggerRef, listId, select, toggle, handleKeys, selectedLabel } =
		useMapMetricSelectRules(props);
	return (
		<div ref={rootRef} className="min-w-0 flex-1">
			<button
				ref={triggerRef}
				type="button"
				aria-label={props.label}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-controls={isOpen ? listId : undefined}
				onClick={toggle}
				onKeyDown={handleKeys}
				className={`flex w-full cursor-pointer items-center justify-between gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-foreground ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
			>
				<span>{selectedLabel}</span>
				<svg
					aria-hidden="true"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					className={`size-3 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
				>
					<path d="m4 6 4 4 4-4" />
				</svg>
			</button>
			{isOpen && (
				<div
					id={listId}
					role="listbox"
					aria-label={props.label}
					onKeyDown={handleKeys}
					className="map-glass mt-2 rounded-[var(--map-radius)] border border-border p-1 shadow-[var(--map-shadow)]"
				>
					{props.options.map((option) => (
						<button
							key={option.value}
							type="button"
							role="option"
							aria-selected={props.value === option.value}
							onClick={() => select(option.value)}
							className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
						>
							{option.label}
							<span aria-hidden="true">{props.value === option.value ? "✓" : ""}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
