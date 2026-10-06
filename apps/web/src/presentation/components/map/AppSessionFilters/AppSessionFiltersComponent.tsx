"use client";

import { useAppSessionFiltersRules } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.rules";
import type { AppSessionFiltersProps } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.types";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

export function AppSessionFilters({ showSessions }: Readonly<AppSessionFiltersProps>) {
	const {
		copy,
		draft,
		setAgeBound,
		invalidAge,
		options,
		sessions,
		dirty,
		apply,
		status,
		menu,
		menuRef,
		fields,
		fieldLabels,
		fieldValues,
		availableFields,
		isSelected,
		choices,
		openMenu,
		closeMenu,
		selectChoice,
		removeField,
		handleKeys,
	} = useAppSessionFiltersRules(showSessions);
	const profileMenu = menu === "gender" || menu === "skill";
	return (
		<section
			aria-label={copy.heading}
			onKeyDown={handleKeys}
			className="mx-2 mb-2 border-b border-border pb-3 pt-1"
		>
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					disabled={!showSessions || !availableFields.length}
					aria-expanded={menu === "add"}
					aria-haspopup="listbox"
					onClick={(event) => openMenu("add", event.currentTarget)}
					className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-foreground disabled:cursor-default disabled:opacity-40 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
				>
					<span aria-hidden="true" className="text-base leading-none">
						+
					</span>
					{copy.add}
				</button>
			</div>
			{fields.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1.5">
					{fields.map((field) => (
						<div
							key={field}
							className="flex max-w-full items-center rounded-md border border-border bg-foreground/[0.03] text-xs"
						>
							<button
								type="button"
								disabled={!showSessions}
								aria-expanded={menu === field}
								aria-haspopup="listbox"
								aria-label={fieldLabels[field]}
								onClick={(event) => openMenu(field, event.currentTarget)}
								className={`flex min-w-0 cursor-pointer items-center gap-1 rounded-l-md py-1.5 pl-2 pr-1 disabled:opacity-50 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
							>
								<span className="truncate">
									{fieldLabels[field]}
									{fieldValues[field] && (
										<span className="font-medium">: {fieldValues[field]}</span>
									)}
								</span>
								<svg
									aria-hidden="true"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className={`size-3 shrink-0 text-muted-foreground transition-transform ${menu === field ? "rotate-180" : ""}`}
								>
									<path d="m4 6 4 4 4-4" />
								</svg>
							</button>
							<button
								type="button"
								disabled={!showSessions}
								aria-label={copy.remove.replace("{filter}", fieldLabels[field])}
								onClick={() => removeField(field)}
								className={`cursor-pointer rounded-r-md px-1.5 py-1.5 text-muted-foreground disabled:opacity-50 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
							>
								<span aria-hidden="true">×</span>
							</button>
						</div>
					))}
				</div>
			)}
			{menu && (
				<div
					ref={menuRef}
					className="map-glass mt-2 rounded-[var(--map-radius)] border border-border p-1 shadow-[var(--map-shadow)]"
				>
					<div className="flex items-center justify-between px-2 py-1.5">
						<p className="text-[10px] font-medium uppercase text-muted-foreground">
							{menu === "add" ? copy.add : fieldLabels[menu]}
						</p>
						<button
							type="button"
							aria-label={copy.close}
							onClick={closeMenu}
							className="cursor-pointer px-1 text-muted-foreground hover:text-foreground"
						>
							<span aria-hidden="true">×</span>
						</button>
					</div>
					{menu === "age" && (
						<div className="px-2 py-2">
							<div className="flex gap-2">
								{(["ageMin", "ageMax"] as const).map((field) => (
									<label key={field} className="min-w-0 flex-1 text-[11px] text-muted-foreground">
										{field === "ageMin" ? copy.minimumAge : copy.maximumAge}
										<input
											type="number"
											min={0}
											max={120}
											step={1}
											value={draft[field] ?? ""}
											onChange={(event) => setAgeBound(field, event.currentTarget.value)}
											className="mt-1 w-full rounded-md border border-border bg-transparent px-2 py-2 text-xs text-foreground outline-none focus:border-pleiful-pitch-green-80"
										/>
									</label>
								))}
							</div>
							<p className="mt-2 text-[11px] text-muted-foreground">{copy.ageRangeHelp}</p>
							{invalidAge && (
								<p role="alert" className="mt-2 text-xs text-red-600">
									{copy.invalidAge}
								</p>
							)}
						</div>
					)}
					{profileMenu && options.isPending && (
						<p role="status" className="px-2 py-2 text-xs text-muted-foreground">
							{copy.loading}
						</p>
					)}
					{profileMenu && options.isError && (
						<p role="status" className="px-2 py-2 text-xs text-muted-foreground">
							{copy.optionsError}{" "}
							<button type="button" onClick={() => options.refetch()} className="underline">
								{copy.retry}
							</button>
						</p>
					)}
					{menu !== "age" && (!profileMenu || options.data) && (
						<div
							role="listbox"
							aria-multiselectable={profileMenu || undefined}
							aria-label={menu === "add" ? copy.add : fieldLabels[menu]}
							className="max-h-48 overflow-y-auto"
						>
							{choices[menu].map((choice) => (
								<button
									key={choice.value}
									type="button"
									role="option"
									aria-selected={isSelected(choice.value)}
									onClick={() => selectChoice(choice.value)}
									className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-xs aria-selected:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
								>
									{choice.label}
									<span aria-hidden="true">{isSelected(choice.value) ? "✓" : ""}</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}
			{dirty && (
				<div className="mt-3 flex items-center justify-between gap-2 px-1">
					<span className="text-[11px] text-muted-foreground">{copy.pending}</span>
					<button
						type="button"
						disabled={!showSessions || invalidAge}
						onClick={apply}
						className="cursor-pointer rounded-md bg-pleiful-pitch-green-80 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
					>
						{copy.apply}
					</button>
				</div>
			)}
			{showSessions && status && (
				<div role="status" className="mt-2 px-2 text-xs text-muted-foreground">
					<p>{status}</p>
					{sessions.isError && (
						<button type="button" onClick={() => sessions.refetch()} className="underline">
							{copy.retry}
						</button>
					)}
				</div>
			)}
		</section>
	);
}
