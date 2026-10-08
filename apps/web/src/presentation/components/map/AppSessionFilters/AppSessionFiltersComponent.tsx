"use client";

import { createContext, useContext } from "react";
import { useAppSessionFiltersRules } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.rules";
import type {
	AgeFieldProps,
	AppSessionFiltersProps,
	CheckMarkProps,
	FilterChevronProps,
	SessionFilterRules,
	StepChevronProps,
} from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.types";
import { MapFilterAddButton } from "@/presentation/components/map/MapFilterAdd/MapFilterAddComponent";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

const SessionFiltersContext = createContext<SessionFilterRules | null>(null);

export function AppSessionFilters({
	showSessions,
	onApplied,
	children,
}: Readonly<AppSessionFiltersProps>) {
	const rules = useAppSessionFiltersRules(showSessions, onApplied);
	return (
		<SessionFiltersContext.Provider value={rules}>
			{children ?? (
				<>
					<SessionFilterChips />
					<SessionFilterAdd />
					<SessionFilterApply />
				</>
			)}
		</SessionFiltersContext.Provider>
	);
}

export function SessionFilterChips() {
	const rules = useContext(SessionFiltersContext);
	if (!rules) return null;
	const { copy, selected, removeOption, showSessions } = rules;
	if (selected.length === 0) return null;
	return (
		<div className="px-2 pb-1">
			{selected.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{selected.map((option) => (
						<span
							key={`${option.field}-${option.id}`}
							className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-foreground/[0.03] py-1 pr-1 pl-2 text-xs"
						>
							<span className="truncate">{option.label}</span>
							<button
								type="button"
								disabled={!showSessions}
								aria-label={copy.remove.replace("{filter}", option.label)}
								onClick={() => removeOption(option.field, option.id)}
								className={`cursor-pointer rounded-full px-1 text-muted-foreground disabled:opacity-50 ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
							>
								<span aria-hidden="true">×</span>
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}

export function SessionFilterAdd() {
	const rules = useContext(SessionFiltersContext);
	if (!rules?.showSessions) return null;
	const {
		copy,
		addOpen,
		addRef,
		sections,
		toggleAdd,
		toggleOption,
		handleKeys,
		isSelected,
		ageOpen,
		toggleAge,
		ageRef,
		ageGroupRef,
		ageText,
		changeAge,
		stepAge,
		ageError,
	} = rules;
	return (
		<section aria-label={copy.heading} onKeyDown={handleKeys}>
			<MapFilterAddButton buttonRef={addRef} label={copy.add} open={addOpen} onClick={toggleAdd} />
			{addOpen && (
				<div className="mt-1 ml-3 border-l border-border pl-1">
					{sections.map((section) => (
						<div key={section.id}>
							<button
								ref={section.buttonRef}
								type="button"
								aria-expanded={section.open}
								onClick={section.toggle}
								className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-foreground/[0.07]"
							>
								{section.label}
								<Chevron open={section.open} pointsRight />
							</button>
							{section.open && (
								<fieldset ref={section.groupRef} className="mt-0.5 border-0 p-0 pl-3">
									<legend className="sr-only">{section.label}</legend>
									{section.options.map((option) => (
										<label
											key={option.id}
											className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs has-checked:bg-foreground/[0.05] ${MAP_SEARCH_OPTION_HOVER_CLASS}`}
										>
											<input
												type="checkbox"
												checked={isSelected(section.id, option.id)}
												onChange={() => toggleOption(section.id, option.id)}
												className="sr-only"
											/>
											{option.label}
											<CheckMark selected={isSelected(section.id, option.id)} />
										</label>
									))}
								</fieldset>
							)}
						</div>
					))}
					<div>
						<button
							ref={ageRef}
							type="button"
							aria-expanded={ageOpen}
							onClick={toggleAge}
							className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-foreground/[0.07]"
						>
							{copy.age}
							<Chevron open={ageOpen} pointsRight />
						</button>
						{ageOpen && (
							<div ref={ageGroupRef} className="mt-0.5 grid gap-1.5 py-1 pr-2 pl-3">
								<div className="grid grid-cols-2 gap-1.5">
									<AgeField
										label={copy.minimumAge}
										value={ageText.min}
										increaseLabel={copy.increaseAge.replace("{age}", copy.minimumAge.toLowerCase())}
										decreaseLabel={copy.decreaseAge.replace("{age}", copy.minimumAge.toLowerCase())}
										onChange={(value) => changeAge("min", value)}
										onStep={(direction) => stepAge("min", direction)}
									/>
									<AgeField
										label={copy.maximumAge}
										value={ageText.max}
										increaseLabel={copy.increaseAge.replace("{age}", copy.maximumAge.toLowerCase())}
										decreaseLabel={copy.decreaseAge.replace("{age}", copy.maximumAge.toLowerCase())}
										onChange={(value) => changeAge("max", value)}
										onStep={(direction) => stepAge("max", direction)}
									/>
								</div>
								<p className="text-[11px] text-muted-foreground">{copy.ageRangeHelp}</p>
								{ageError && <p className="text-[11px] text-foreground">{ageError}</p>}
							</div>
						)}
					</div>
				</div>
			)}
		</section>
	);
}

export function SessionFilterApply() {
	const rules = useContext(SessionFiltersContext);
	if (!rules?.showSessions || !rules.pending) return null;
	return (
		<div className="border-t border-border p-2">
			<button
				type="button"
				onClick={rules.applyFilters}
				className="w-full cursor-pointer rounded-md bg-black/5 px-2 py-1.5 text-xs font-medium text-black hover:bg-black/10"
			>
				{rules.copy.apply}
			</button>
		</div>
	);
}

function AgeField({
	label,
	value,
	increaseLabel,
	decreaseLabel,
	onChange,
	onStep,
}: Readonly<AgeFieldProps>) {
	return (
		<label className="grid min-w-0 gap-1 text-xs">
			{label}
			<span className="group relative block">
				<input
					type="text"
					inputMode="numeric"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="w-full rounded-md border border-border bg-transparent px-2 py-1 pr-5 transition-colors hover:border-foreground/25 hover:bg-foreground/[0.07] focus:border-foreground/30 focus:bg-foreground/[0.07] focus:outline-none"
				/>
				<span className="absolute inset-y-px right-px hidden w-4 flex-col group-hover:flex group-focus-within:flex">
					<button
						type="button"
						aria-label={increaseLabel}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => onStep(1)}
						className="flex flex-1 cursor-pointer items-center justify-center rounded-tr-[5px] text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
					>
						<StepChevron direction="up" />
					</button>
					<button
						type="button"
						aria-label={decreaseLabel}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => onStep(-1)}
						className="flex flex-1 cursor-pointer items-center justify-center rounded-br-[5px] text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
					>
						<StepChevron direction="down" />
					</button>
				</span>
			</span>
		</label>
	);
}

function StepChevron({ direction }: Readonly<StepChevronProps>) {
	const rotation = { up: "rotate-180", down: "" }[direction];
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`size-2.5 ${rotation}`}
		>
			<path d="m4 6 4 4 4-4" />
		</svg>
	);
}

function CheckMark({ selected }: Readonly<CheckMarkProps>) {
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

function Chevron({ open, pointsRight = false }: Readonly<FilterChevronProps>) {
	const rotation = {
		[`${true}`]: "",
		[`${pointsRight && !open}`]: "-rotate-90",
		[`${!pointsRight && open}`]: "rotate-180",
	}.true;
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`size-3 shrink-0 text-muted-foreground transition-transform ${rotation}`}
		>
			<path d="m4 6 4 4 4-4" />
		</svg>
	);
}
