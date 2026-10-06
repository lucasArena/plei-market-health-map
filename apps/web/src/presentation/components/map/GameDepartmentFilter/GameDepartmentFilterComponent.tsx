"use client";

import { useGameDepartmentFilterRules } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.rules";
import type { GameDepartmentFilterProps } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.types";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

export function GameDepartmentFilter({ enabled }: Readonly<GameDepartmentFilterProps>) {
	const {
		copy,
		menu,
		rootRef,
		draft,
		hasField,
		dirty,
		options,
		summary,
		draftSummary,
		openMenu,
		closeMenu,
		addDepartment,
		toggleDepartment,
		reset,
		apply,
		handleKeys,
	} = useGameDepartmentFilterRules(enabled);
	const filters = copy.sessionFilters;
	return (
		<section
			ref={rootRef}
			aria-label={copy.gameDepartment}
			onKeyDown={handleKeys}
			className="mx-2 pb-1.5 pt-1"
		>
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					disabled={!enabled || hasField}
					aria-expanded={menu === "add"}
					aria-haspopup="listbox"
					onClick={(event) => openMenu("add", event.currentTarget)}
					className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-foreground disabled:cursor-default disabled:opacity-40 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
				>
					<span aria-hidden="true" className="text-base leading-none">
						+
					</span>
					{filters.add}
				</button>
				{(hasField || dirty || summary) && (
					<button
						type="button"
						onClick={reset}
						className="cursor-pointer rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
					>
						{filters.reset}
					</button>
				)}
			</div>
			{hasField && (
				<div className="mt-2 flex flex-wrap gap-1.5">
					<div className="flex max-w-full items-center rounded-md border border-border bg-foreground/[0.03] text-xs">
						<button
							type="button"
							disabled={!enabled}
							aria-expanded={menu === "department"}
							aria-haspopup="listbox"
							aria-label={copy.gameDepartment}
							onClick={(event) => openMenu("department", event.currentTarget)}
							className={`flex min-w-0 cursor-pointer items-center gap-1 rounded-l-md py-1.5 pl-2 pr-1 disabled:opacity-50 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
						>
							<span className="truncate">
								{copy.gameDepartment}
								{draftSummary && <span className="font-medium">: {draftSummary}</span>}
							</span>
							<svg
								aria-hidden="true"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								className={`size-3 shrink-0 text-muted-foreground transition-transform ${menu === "department" ? "rotate-180" : ""}`}
							>
								<path d="m4 6 4 4 4-4" />
							</svg>
						</button>
						<button
							type="button"
							disabled={!enabled}
							aria-label={filters.remove.replace("{filter}", copy.gameDepartment)}
							onClick={reset}
							className={`cursor-pointer rounded-r-md px-1.5 py-1.5 text-muted-foreground disabled:opacity-50 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
						>
							<span aria-hidden="true">×</span>
						</button>
					</div>
				</div>
			)}
			{menu && (
				<div className="map-glass mt-2 rounded-[var(--map-radius)] border border-border p-1 shadow-[var(--map-shadow)]">
					<div className="flex items-center justify-between px-2 py-1.5">
						<p className="text-[10px] font-medium uppercase text-muted-foreground">
							{menu === "add" ? filters.add : copy.gameDepartment}
						</p>
						<button
							type="button"
							aria-label={filters.close}
							onClick={closeMenu}
							className="cursor-pointer px-1 text-muted-foreground hover:text-foreground"
						>
							<span aria-hidden="true">×</span>
						</button>
					</div>
					<div
						role="listbox"
						aria-label={menu === "add" ? filters.add : copy.gameDepartment}
						aria-multiselectable={menu === "department" || undefined}
						className="max-h-48 overflow-y-auto"
					>
						{menu === "add" ? (
							<button
								type="button"
								role="option"
								aria-selected={false}
								onClick={addDepartment}
								className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-xs aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
							>
								{copy.gameDepartment}
							</button>
						) : (
							options.map((option) => (
								<button
									key={option.value}
									type="button"
									role="option"
									aria-selected={draft.includes(option.value)}
									onClick={() => toggleDepartment(option.value)}
									className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-xs aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
								>
									{option.label}
									<span aria-hidden="true">{draft.includes(option.value) ? "✓" : ""}</span>
								</button>
							))
						)}
					</div>
				</div>
			)}
			{dirty && (
				<div className="mt-3 flex items-center justify-between gap-2 px-1">
					<span className="text-[11px] text-muted-foreground">{filters.pending}</span>
					<button
						type="button"
						disabled={!enabled}
						onClick={apply}
						className="cursor-pointer rounded-md bg-pleiful-pitch-green-80 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
					>
						{filters.apply}
					</button>
				</div>
			)}
		</section>
	);
}
