"use client";

import type {
	DrillDownMeasure,
	DrillDownSegment,
	DrillDownSlice,
} from "@market-health-map/core/application";
import { useMetricDrillDownPanelRules } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.rules";
import {
	DRILL_DOWN_COLORS,
	DRILL_DOWN_PANEL_CLASS,
} from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.styles";
import type { MetricDrillDownPanelProps } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.types";

export function MetricDrillDownPanel(props: Readonly<MetricDrillDownPanelProps>) {
	const rules = useMetricDrillDownPanelRules(props);
	const {
		messages: m,
		selection,
		rows,
		chartRows,
		view,
		segment,
		formatValue,
		rowName,
		departmentNames,
	} = rules;
	if (!props.isOpen) return null;
	return (
		<aside
			id="metric-drill-down-panel"
			ref={rules.panelRef}
			aria-label={m.title}
			aria-busy={rules.isLoading}
			className={DRILL_DOWN_PANEL_CLASS}
		>
			<div className="flex items-start justify-between gap-2 px-5 pt-5">
				<div>
					<h2 className="text-base font-semibold">{m.title}</h2>
					<p className="text-xs text-muted-foreground">{rules.heading}</p>
				</div>
				<button
					ref={rules.closeButtonRef}
					type="button"
					onClick={rules.close}
					aria-label={m.close}
					className="size-8 shrink-0 cursor-pointer rounded-full text-lg hover:bg-foreground/5"
				>
					×
				</button>
			</div>
			<div className="min-h-0 space-y-4 overflow-y-auto p-5 pt-3">
				{selection.marketId && (
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<button type="button" onClick={rules.back} className="cursor-pointer underline">
							← {m.back}
						</button>
						<span>{selection.marketName}</span>
						{selection.department && <span>· {departmentNames[selection.department]}</span>}
					</div>
				)}
				<div>
					<p className="text-3xl font-semibold tabular-nums">
						{rules.isLoading || rules.isError ? "—" : formatValue(view.total)}
					</p>
					<p className="text-xs">
						{m[selection.measure === "games" ? "games" : "activeFacilities"]}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">{rules.dateRange}</p>
				</div>
				<div className="grid grid-cols-1 gap-2 text-xs min-[400px]:grid-cols-3">
					<label className="min-w-0 space-y-1">
						<span title={m.measureHelp}>{m.measure}</span>
						<select
							aria-label={m.measure}
							title={m.measureHelp}
							value={selection.measure}
							onChange={(event) => rules.setMeasure(event.target.value as DrillDownMeasure)}
							className="w-full rounded-lg border border-border bg-background/60 p-2"
						>
							<option value="games">{m.games}</option>
							<option value="active-facilities">{m.activeFacilities}</option>
						</select>
					</label>
					<label className="min-w-0 space-y-1">
						<span title={m.sliceHelp}>{m.slice}</span>
						<select
							aria-label={m.slice}
							title={m.sliceHelp}
							value={selection.slice}
							onChange={(event) => rules.setSlice(event.target.value as DrillDownSlice)}
							className="w-full rounded-lg border border-border bg-background/60 p-2"
						>
							<option value="market">{m.market}</option>
							<option value="facility">{m.facility}</option>
							{selection.measure === "games" && <option value="department">{m.department}</option>}
						</select>
					</label>
					<label className="min-w-0 space-y-1">
						<span title={m.segmentHelp}>{m.segment}</span>
						<select
							aria-label={m.segment}
							aria-describedby={!rules.canSegment ? "drill-down-segment-help" : undefined}
							title={m.segmentHelp}
							disabled={!rules.canSegment}
							value={segment}
							onChange={(event) => rules.setSegment(event.target.value as DrillDownSegment)}
							className="w-full rounded-lg border border-border bg-background/60 p-2 disabled:opacity-60"
						>
							<option value="none">{m.none}</option>
							<option value="department">{m.department}</option>
						</select>
					</label>
				</div>
				<p className="text-xs text-muted-foreground">{m.help}</p>
				{!rules.canSegment && (
					<p id="drill-down-segment-help" className="text-xs text-muted-foreground">
						{selection.department ? m.selectedDepartmentHelp : m.segmentUnavailable}
					</p>
				)}
				{rules.isLoading && (
					<p role="status" className="animate-pulse text-sm">
						{m.loading}
					</p>
				)}
				{rules.isError && (
					<div role="alert" className="text-sm">
						<p>{m.failed}</p>
						<button type="button" onClick={rules.retry} className="mt-2 cursor-pointer underline">
							{m.retry}
						</button>
					</div>
				)}
				{!rules.isLoading && !rules.isError && (
					<>
						{rules.incomplete && (
							<p role="status" className="text-xs text-muted-foreground">
								{m.incomplete}
							</p>
						)}
						{rules.isEmpty && (
							<p role="status" className="text-sm text-muted-foreground">
								{m.empty}
							</p>
						)}
						{!rules.isEmpty && (
							<section aria-label={m.chart} className="space-y-3">
								{view.rows.length > 10 && (
									<p className="text-xs text-muted-foreground">{m.topTen}</p>
								)}
								{segment === "department" && (
									<div className="flex flex-wrap gap-3 text-[11px]">
										{rules.departments.map((department) => (
											<span key={department} className="flex items-center gap-1">
												<span
													aria-hidden="true"
													className="size-2 rounded-full"
													style={{ backgroundColor: DRILL_DOWN_COLORS[department] }}
												/>
												{departmentNames[department]}
											</span>
										))}
									</div>
								)}
								{chartRows.map((row) => (
									<div key={row.id} className="space-y-1">
										<div className="flex justify-between gap-2 text-xs">
											<span className="truncate">{rowName(row)}</span>
											<span className="shrink-0 tabular-nums">{formatValue(row.value)}</span>
										</div>
										<div className="flex h-5 w-full items-center rounded bg-foreground/5">
											{row.bars.length === 0 && (
												<span className="px-2 text-[10px] text-muted-foreground">
													{m.unavailable}
												</span>
											)}
											{row.bars.map((bar) => (
												<button
													key={bar.id}
													type="button"
													onClick={() => rules.explore(row, bar.department)}
													title={bar.label}
													aria-label={bar.label}
													style={{
														width: `${bar.width}%`,
														backgroundColor:
															bar.value === 0
																? "transparent"
																: DRILL_DOWN_COLORS[bar.department ?? "partnerships"],
													}}
													className="h-5 min-w-[2px] cursor-pointer rounded-sm focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
												/>
											))}
										</div>
									</div>
								))}
							</section>
						)}
						{rows.length > 0 && (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead>
										<tr className="border-b border-border">
											<th
												aria-sort={
													rules.sort.startsWith("name")
														? ({ "name-asc": "ascending", "name-desc": "descending" } as const)[
																rules.sort as "name-asc" | "name-desc"
															]
														: "none"
												}
												className="py-2"
											>
												<button
													type="button"
													onClick={() =>
														rules.setSort(rules.sort === "name-asc" ? "name-desc" : "name-asc")
													}
													className="cursor-pointer"
												>
													{m[selection.slice]} ↕
												</button>
											</th>
											<th
												aria-sort={
													rules.sort.startsWith("count")
														? ({ "count-asc": "ascending", "count-desc": "descending" } as const)[
																rules.sort as "count-asc" | "count-desc"
															]
														: "none"
												}
												className="text-right"
											>
												<button
													type="button"
													onClick={() =>
														rules.setSort(rules.sort === "count-desc" ? "count-asc" : "count-desc")
													}
													className="cursor-pointer"
												>
													{m.value} ↕
												</button>
											</th>
											{segment === "department" &&
												rules.departments.map((department) => (
													<th key={department} className="px-2 text-right">
														{departmentNames[department]}
													</th>
												))}
											{selection.slice !== "department" && (
												<th>
													<span className="sr-only">{m.viewOnMap}</span>
												</th>
											)}
										</tr>
									</thead>
									<tbody>
										{rows.map((row) => (
											<tr key={row.id} className="border-b border-border/50">
												<td className="py-2 pr-2">
													{selection.slice === "market" ? (
														<button
															type="button"
															onClick={() => rules.explore(row)}
															className="cursor-pointer text-left hover:underline"
														>
															{rowName(row)}
														</button>
													) : (
														rowName(row)
													)}
												</td>
												<td className="text-right tabular-nums">{formatValue(row.value)}</td>
												{segment === "department" &&
													rules.departments.map((department) => (
														<td key={department} className="px-2 text-right tabular-nums">
															{formatValue(row.departments?.[department] ?? null)}
														</td>
													))}
												{selection.slice !== "department" && (
													<td className="py-2 pl-3 text-right">
														<button
															type="button"
															onClick={() => rules.viewOnMap(row)}
															aria-label={`${m.viewOnMap}: ${rowName(row)}`}
															className="cursor-pointer whitespace-nowrap text-muted-foreground hover:text-foreground hover:underline"
														>
															{m.viewOnMap}
														</button>
													</td>
												)}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}
			</div>
		</aside>
	);
}
