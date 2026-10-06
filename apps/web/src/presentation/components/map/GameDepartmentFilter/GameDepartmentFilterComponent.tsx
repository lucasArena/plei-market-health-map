"use client";

import { useGameDepartmentFilterRules } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.rules";
import type { GameDepartmentFilterProps } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.types";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

export function GameDepartmentFilter({ enabled }: Readonly<GameDepartmentFilterProps>) {
	const {
		copy,
		isOpen,
		rootRef,
		triggerRef,
		menuId,
		selected,
		options,
		summary,
		toggleDepartment,
		reset,
		handleKeys,
		toggleMenu,
	} = useGameDepartmentFilterRules(enabled);
	return (
		<fieldset
			aria-label={copy.gameDepartment}
			ref={rootRef}
			onKeyDown={handleKeys}
			className="relative mx-2 mb-2 pt-1"
		>
			<button
				ref={triggerRef}
				type="button"
				disabled={!enabled}
				aria-label={copy.gameDepartment}
				aria-expanded={isOpen}
				aria-controls={menuId}
				aria-haspopup="dialog"
				onClick={toggleMenu}
				className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs disabled:opacity-40 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
			>
				<span className="min-w-0 truncate">
					{copy.gameDepartment}: <span className="font-medium">{summary}</span>
				</span>
				<span aria-hidden="true">⌄</span>
			</button>
			{isOpen && (
				<div
					id={menuId}
					role="dialog"
					aria-label={copy.gameDepartment}
					className="map-glass mt-1 rounded-lg border border-border p-1 shadow-lg"
				>
					{options.map((option) => (
						<label
							key={option.value}
							className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
						>
							<input
								type="checkbox"
								checked={selected.includes(option.value)}
								onChange={() => toggleDepartment(option.value)}
								className="accent-pleiful-pitch-green-50"
							/>
							{option.label}
						</label>
					))}
					{selected.length > 0 && (
						<button
							type="button"
							onClick={reset}
							className="w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
						>
							{copy.sessionFilters.reset}
						</button>
					)}
				</div>
			)}
		</fieldset>
	);
}
