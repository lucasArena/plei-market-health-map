"use client";

import { createContext, useContext } from "react";
import { useGameDepartmentFiltersRules } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.rules";
import type {
	DepartmentCheckMarkProps,
	GameDepartmentFiltersProps,
	GameDepartmentRules,
} from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.types";
import {
	MapFilterAddButton,
	MapFilterChevron,
} from "@/presentation/components/map/MapFilterAdd/MapFilterAddComponent";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

const GameDepartmentFiltersContext = createContext<GameDepartmentRules | null>(null);

export function GameDepartmentFilters({ enabled, children }: Readonly<GameDepartmentFiltersProps>) {
	const rules = useGameDepartmentFiltersRules({ enabled });
	return (
		<GameDepartmentFiltersContext.Provider value={rules}>
			{children ?? (
				<>
					<GameDepartmentFilterChips />
					<GameDepartmentFilterAdd />
					<GameDepartmentFilterApply />
				</>
			)}
		</GameDepartmentFiltersContext.Provider>
	);
}

export function GameDepartmentFilterChips() {
	const rules = useContext(GameDepartmentFiltersContext);
	if (!rules || rules.appliedChips.length === 0) return null;
	const { filters, appliedChips, enabled, removeDepartment } = rules;
	return (
		<div className="px-2 pb-1">
			<div className="flex flex-wrap gap-1.5">
				{appliedChips.map((option) => (
					<span
						key={option.value}
						className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-foreground/[0.03] py-1 pr-1 pl-2 text-xs"
					>
						<span className="truncate">{option.label}</span>
						<button
							type="button"
							disabled={!enabled}
							aria-label={filters.remove.replace("{filter}", option.label)}
							onClick={() => removeDepartment(option.value)}
							className={`cursor-pointer rounded-full px-1 text-muted-foreground disabled:opacity-50 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
						>
							<span aria-hidden="true">×</span>
						</button>
					</span>
				))}
			</div>
		</div>
	);
}

export function GameDepartmentFilterAdd() {
	const rules = useContext(GameDepartmentFiltersContext);
	if (!rules?.enabled) return null;
	const {
		copy,
		filters,
		rootRef,
		addOpen,
		addRef,
		departmentOpen,
		departmentRef,
		departmentGroupRef,
		toggleAdd,
		toggleDepartment,
		isSelected,
		toggleOption,
		handleKeys,
		options,
	} = rules;
	return (
		<section ref={rootRef} aria-label={copy.gameDepartment} onKeyDown={handleKeys}>
			<MapFilterAddButton
				buttonRef={addRef}
				label={filters.add}
				open={addOpen}
				onClick={toggleAdd}
			/>
			{addOpen && (
				<div className="mt-1 ml-3 border-l border-border pl-1">
					<button
						ref={departmentRef}
						type="button"
						aria-expanded={departmentOpen}
						onClick={toggleDepartment}
						className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-foreground/[0.07]"
					>
						{copy.gameDepartment}
						<MapFilterChevron open={departmentOpen} pointsRight />
					</button>
					{departmentOpen && (
						<fieldset ref={departmentGroupRef} className="mt-0.5 border-0 p-0 pl-3">
							<legend className="sr-only">{copy.gameDepartment}</legend>
							{options.map((option) => (
								<label
									key={option.value}
									className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs has-checked:bg-foreground/[0.05] hover:bg-foreground/[0.07]`}
								>
									<input
										type="checkbox"
										checked={isSelected(option.value)}
										onChange={() => toggleOption(option.value)}
										className="sr-only"
									/>
									{option.label}
									<CheckMark selected={isSelected(option.value)} />
								</label>
							))}
						</fieldset>
					)}
				</div>
			)}
		</section>
	);
}

export function GameDepartmentFilterApply() {
	const rules = useContext(GameDepartmentFiltersContext);
	if (!rules?.enabled || !rules.pending) return null;
	return (
		<div className="border-t border-border p-2">
			<button
				type="button"
				onClick={rules.apply}
				className="w-full cursor-pointer rounded-md bg-black/5 dark:bg-foreground/5 px-2 py-1.5 text-xs font-medium text-black dark:text-foreground hover:bg-black/10 dark:hover:bg-foreground/10"
			>
				{rules.filters.apply}
			</button>
		</div>
	);
}

export function GameDepartmentFilter({ enabled }: Readonly<GameDepartmentFiltersProps>) {
	return (
		<GameDepartmentFilters enabled={enabled}>
			<GameDepartmentFilterChips />
			<GameDepartmentFilterAdd />
		</GameDepartmentFilters>
	);
}

function CheckMark({ selected }: Readonly<DepartmentCheckMarkProps>) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`size-3 shrink-0 text-muted-foreground ${selected ? "" : "opacity-0"}`}
		>
			<path d="m3.5 8.5 3 3 6-6.5" />
		</svg>
	);
}
