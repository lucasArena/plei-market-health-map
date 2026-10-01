"use client";

import { useAppSessionFiltersRules } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.rules";
import type { AppSessionFiltersProps } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.types";

const SELECT_CLASS =
	"mt-1 w-full rounded-md border border-border bg-background/70 px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-50 disabled:opacity-50";

export function AppSessionFilters({ showSessions }: Readonly<AppSessionFiltersProps>) {
	const {
		copy,
		draft,
		options,
		sessions,
		ageRanges,
		ageKey,
		summary,
		hasFilters,
		dirty,
		setField,
		setAge,
		apply,
		reset,
		status,
	} = useAppSessionFiltersRules(showSessions);
	return (
		<section aria-label={copy.heading} className="mx-2 mb-2 rounded-lg border border-border p-3">
			<div className="flex items-center justify-between gap-2">
				<h3 className="text-xs font-medium">{copy.heading}</h3>
				{(hasFilters || dirty) && (
					<button
						type="button"
						onClick={reset}
						className="cursor-pointer text-xs underline underline-offset-2"
					>
						{copy.reset}
					</button>
				)}
			</div>
			<p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
				{summary ? copy.applied.replace("{filters}", summary) : copy.allPlayers}
			</p>
			<fieldset disabled={!showSessions} className="mt-3 space-y-3 disabled:opacity-60">
				<label className="block text-xs">
					{copy.gender}
					<select
						className={SELECT_CLASS}
						value={draft.gender ?? ""}
						disabled={!options.data}
						onChange={(event) => setField("gender", event.target.value)}
					>
						<option value="">{copy.allGenders}</option>
						{options.data?.genders.map((gender) => (
							<option key={gender} value={gender}>
								{gender}
							</option>
						))}
					</select>
				</label>
				<label className="block text-xs">
					{copy.skill}
					<select
						className={SELECT_CLASS}
						value={draft.skill ?? ""}
						disabled={!options.data}
						onChange={(event) => setField("skill", event.target.value)}
					>
						<option value="">{copy.allSkills}</option>
						{options.data?.skills.map((skill) => (
							<option key={skill} value={skill}>
								{skill}
							</option>
						))}
					</select>
				</label>
				<label className="block text-xs">
					{copy.age}
					<select
						className={SELECT_CLASS}
						value={ageKey}
						onChange={(event) => setAge(event.target.value)}
					>
						{ageRanges.map((range) => (
							<option key={range.key} value={range.key}>
								{range.label}
							</option>
						))}
					</select>
				</label>
				<p className="text-[11px] leading-relaxed text-muted-foreground">{copy.help}</p>
				{dirty && <p className="text-xs text-muted-foreground">{copy.pending}</p>}
				<button
					type="button"
					disabled={!dirty}
					onClick={apply}
					className="w-full cursor-pointer rounded-md bg-pleiful-pitch-green-80 px-3 py-2 text-xs font-medium text-white disabled:cursor-default disabled:opacity-40"
				>
					{copy.apply}
				</button>
			</fieldset>
			{showSessions && (
				<div role="status" className="mt-2 text-xs text-muted-foreground">
					{options.isPending && copy.loading}
					{options.isError && (
						<>
							{copy.optionsError}{" "}
							<button type="button" onClick={() => options.refetch()} className="underline">
								{copy.retry}
							</button>
						</>
					)}
					{status && <p>{status}</p>}
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
