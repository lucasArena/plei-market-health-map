"use client";
import { createPortal } from "react-dom";
import { MapFilterChevron } from "@/presentation/components/map/MapFilterAdd/MapFilterAddComponent";
import { useMapMetricSelectRules } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.rules";
import type { MapMetricSelectProps } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.types";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";
export function MapMetricSelect(props: Readonly<MapMetricSelectProps>) {
	const rules = useMapMetricSelectRules(props);
	return (
		<fieldset
			ref={rules.rootRef}
			aria-label={props.label}
			onKeyDown={rules.keys}
			className={rules.classes.root}
		>
			<span className={rules.classes.label}>{props.label}</span>
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
				className={rules.classes.trigger}
			>
				<span
					className={
						props.variant === "pill" ? "truncate" : "min-w-0 whitespace-normal break-words"
					}
				>
					{rules.selected}
				</span>
				<MapFilterChevron open={rules.open} />
			</button>
			{rules.open && (
				<div
					ref={rules.menuRef}
					id={rules.id}
					role="listbox"
					aria-label={props.label}
					className={`${rules.classes.menu} ${props.alignRight ? "right-0" : "left-0"}`}
				>
					{props.options.map((option) => (
						<button
							key={option.value}
							type="button"
							role="option"
							aria-selected={rules.isSelected(option.value)}
							data-value={option.value}
							aria-haspopup={option.children ? "listbox" : undefined}
							aria-controls={
								option.children && rules.submenu?.value === option.value
									? `${rules.id}-submenu`
									: undefined
							}
							onMouseEnter={() => rules.hoverOption(option.value)}
							onClick={() => rules.choose(option.value)}
							className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
						>
							{option.label}
							{option.children ? (
								<svg
									aria-hidden="true"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="size-3 shrink-0 text-muted-foreground"
								>
									<path d="m6 3 4 5-4 5" />
								</svg>
							) : (
								<svg
									aria-hidden="true"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className={`size-3 shrink-0 text-muted-foreground ${
										option.value === props.value ? "" : "invisible"
									}`}
								>
									<path d="m3.5 8.5 3 3 6-6.5" />
								</svg>
							)}
						</button>
					))}
				</div>
			)}
			{rules.open &&
				rules.submenu &&
				rules.submenuOption?.children &&
				createPortal(
					<div
						ref={rules.submenuRef}
						id={`${rules.id}-submenu`}
						role="listbox"
						aria-label={rules.submenuOption.label}
						className={`${rules.classes.menu} !fixed !z-[100] !mt-0 !min-w-40 w-40`}
						style={{ left: rules.submenu.left, top: rules.submenu.top }}
					>
						{rules.submenuOption.children.map((option) => (
							<button
								key={option.value}
								type="button"
								role="option"
								aria-selected={option.value === props.value}
								onClick={() => rules.choose(option.value)}
								className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
							>
								{option.label}
								<svg
									aria-hidden="true"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className={`size-3 shrink-0 text-muted-foreground ${
										option.value === props.value ? "" : "invisible"
									}`}
								>
									<path d="m3.5 8.5 3 3 6-6.5" />
								</svg>
							</button>
						))}
					</div>,
					document.body,
				)}
		</fieldset>
	);
}
