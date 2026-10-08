"use client";
import { MapFilterChevron } from "@/presentation/components/map/MapFilterAdd/MapFilterAddComponent";
import { useMapMetricSelectRules } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.rules";
import type { MapMetricSelectProps } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.types";
import {
	MAP_MENU_SURFACE_CLASS,
	MAP_SEARCH_OPTION_HOVER_CLASS,
} from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";
export function MapMetricSelect(props: Readonly<MapMetricSelectProps>) {
	const rules = useMapMetricSelectRules(props);
	return (
		<fieldset
			ref={rules.rootRef}
			aria-label={props.label}
			onKeyDown={rules.keys}
			className="relative min-w-0 space-y-1 border-0 p-0"
		>
			<span className="block text-muted-foreground">{props.label}</span>
			<button
				ref={rules.triggerRef}
				type="button"
				role="combobox"
				aria-label={props.label}
				aria-expanded={rules.open}
				aria-haspopup="listbox"
				aria-controls={rules.id}
				aria-describedby={props.descriptionId}
				title={props.help}
				disabled={props.disabled}
				onClick={rules.toggle}
				className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-foreground/[0.03] px-2 py-2 text-left text-xs hover:bg-foreground/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-60"
			>
				<span className="truncate">{rules.selected}</span>
				<MapFilterChevron open={rules.open} />
			</button>
			{rules.open && (
				<div
					ref={rules.menuRef}
					id={rules.id}
					role="listbox"
					aria-label={props.label}
					className={`${MAP_MENU_SURFACE_CLASS} ${props.alignRight ? "right-0" : "left-0"} z-50 min-w-48 bg-background/90`}
				>
					{props.options.map((option) => (
						<button
							key={option.value}
							type="button"
							role="option"
							aria-selected={option.value === props.value}
							onClick={() => rules.choose(option.value)}
							className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
						>
							{option.label}
							<span
								aria-hidden="true"
								className={option.value === props.value ? "text-muted-foreground" : "invisible"}
							>
								✓
							</span>
						</button>
					))}
				</div>
			)}
		</fieldset>
	);
}
