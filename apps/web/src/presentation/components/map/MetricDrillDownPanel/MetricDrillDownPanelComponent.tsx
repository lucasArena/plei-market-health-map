"use client";

import type {
	DrillDownMeasure,
	DrillDownSegment,
	DrillDownSlice,
} from "@market-health-map/core/application";
import { MapMetricSelect } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent";
import { useMetricDrillDownPanelRules } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.rules";
import {
	DRILL_DOWN_COLORS,
	DRILL_DOWN_EXPANDED_PANEL_CLASS,
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
		segment,
		formatValue,
		rowName,
		departmentNames,
	} = rules;
	if (!props.isOpen && !props.isClosing) return null;
	return (
		<aside
			id="metric-drill-down-panel"
			ref={rules.panelRef}
			aria-label={m.title}
			aria-busy={rules.isLoading}
			inert={props.isClosing}
			data-closing={!!props.isClosing}
			onAnimationEnd={rules.handleAnimationEnd}
			className={`${props.isClosing ? "panel-slide-out pointer-events-none" : "panel-slide-in"} ${rules.isExpanded ? DRILL_DOWN_EXPANDED_PANEL_CLASS : DRILL_DOWN_PANEL_CLASS}`}
		>
			<div className="flex items-start justify-between gap-2 px-5 pt-5">
				<div>
					<h2 className="text-base font-semibold">{m.title}</h2>
					<p className="text-xs text-muted-foreground">{rules.heading}</p>
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={rules.toggleExpanded}
						aria-label={rules.isExpanded ? m.collapse : m.expand}
						title={rules.isExpanded ? m.collapse : m.expand}
						aria-pressed={rules.isExpanded}
						className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
							className="size-4"
						>
							<path
								d={
									rules.isExpanded
										? "M9 3v6H3m12 12v-6h6M9 9 3 3m12 12 6 6"
										: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
								}
							/>
						</svg>
					</button>
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
			</div>
			<div className="min-h-0 space-y-4 overflow-y-auto p-5 pt-3">
				{rules.showScopeBack && (
					<button
						type="button"
						onClick={rules.clearScope}
						className="cursor-pointer text-xs underline"
					>
						← {m.allMarkets}
					</button>
				)}
				<div>
					<p className="text-3xl font-semibold tabular-nums">
						{rules.isLoading || rules.isError ? "—" : formatValue(rules.headlineValue)}
					</p>
					<p className="text-xs">
						{m[selection.measure === "games" ? "games" : "activeFacilities"]}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">{rules.dateRange}</p>
					{rules.focusLabel && <p className="mt-1 text-xs font-medium">{rules.focusLabel}</p>}
					<p className="mt-1 text-xs text-muted-foreground">{m.selectionHelp}</p>
				</div>

				<div className="grid grid-cols-1 gap-2 text-xs min-[400px]:grid-cols-3">
					<MapMetricSelect
						label={m.measure}
						help={m.measureHelp}
						value={selection.measure}
						onChange={(value) => rules.setMeasure(value as DrillDownMeasure)}
						options={[
							{ value: "games", label: m.games },
							{ value: "active-facilities", label: m.activeFacilities },
						]}
					/>
					<MapMetricSelect
						label={m.slice}
						help={m.sliceHelp}
						value={selection.slice}
						onChange={(value) => rules.setSlice(value as DrillDownSlice)}
						options={[
							{ value: "market", label: m.market },
							{ value: "facility", label: m.facility },
							...(selection.measure === "games"
								? [{ value: "department", label: m.department }]
								: []),
						]}
					/>
					<MapMetricSelect
						label={m.segment}
						help={m.segmentHelp}
						value={segment}
						disabled={!rules.canSegment}
						descriptionId={!rules.canSegment ? "drill-down-segment-help" : undefined}
						alignRight
						onChange={(value) => rules.setSegment(value as DrillDownSegment)}
						options={[
							{ value: "none", label: m.none },
							{ value: "department", label: m.department },
						]}
					/>
				</div>
				<p className="text-xs text-muted-foreground">{m.help}</p>
				{rules.filteredDepartments.length > 0 && (
					<div className="flex flex-wrap items-center gap-1.5 text-xs">
						<span className="text-muted-foreground">{m.filteredBy}</span>
						{rules.filteredDepartments.map((department) => (
							<span
								key={department}
								className="rounded-full border border-border bg-foreground/[0.03] px-2 py-1"
							>
								{departmentNames[department]}
							</span>
						))}
					</div>
				)}
				{!rules.showSupply && <p className="text-xs text-muted-foreground">{m.supplyHidden}</p>}
				{!rules.canSegment && (
					<p id="drill-down-segment-help" className="text-xs text-muted-foreground">
						{m.segmentUnavailable}
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
								{rules.chartTruncated && (
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
								<div className="relative pr-9">
									<div className={`relative ${rules.isExpanded ? "h-80" : "h-52"}`}>
										<div aria-hidden="true" className="absolute inset-0">
											{rules.ticks.map((tick) => (
												<div
													key={tick}
													className="absolute inset-x-0 border-t border-dashed border-foreground/15"
													style={{ bottom: `${(tick / rules.max) * 100}%` }}
												>
													<span className="absolute -right-9 -translate-y-1/2 w-7 text-right text-[10px] tabular-nums text-muted-foreground">
														{formatValue(tick)}
													</span>
												</div>
											))}
										</div>
										<div className="relative flex h-full items-end justify-around gap-2 px-1">
											{chartRows.map((row) => (
												<div
													key={row.id}
													className="flex h-full min-w-0 flex-1 items-end justify-center"
												>
													<div className="flex h-full w-3 flex-col-reverse justify-start min-[400px]:w-4">
														{row.bars.length === 0 && (
															<span
																title={m.unavailable}
																className="text-center text-xs text-muted-foreground"
															>
																—
															</span>
														)}
														{row.bars.map((bar) => (
															<button
																key={bar.id}
																type="button"
																onClick={() => rules.toggleFocus(row, bar.department)}
																aria-pressed={rules.isSelected(row, bar.department)}
																aria-label={bar.label}
																style={{
																	height: `${bar.height}%`,
																	backgroundColor:
																		bar.value === 0
																			? "transparent"
																			: DRILL_DOWN_COLORS[bar.department ?? "organizers"],
																}}
																className="group relative aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 min-h-[2px] w-full shrink-0 cursor-pointer transition-opacity hover:z-10 hover:opacity-90 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
															>
																<span
																	aria-hidden="true"
																	className={`pointer-events-none absolute bottom-full ${rules.tooltipAlignment(row)} z-20 mb-2 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground opacity-0 shadow-sm group-hover:opacity-100 group-focus-visible:opacity-100`}
																>
																	{bar.label}
																</span>
															</button>
														))}
													</div>
												</div>
											))}
										</div>
									</div>
									<div aria-hidden="true" className="mt-2 flex justify-around gap-2 px-1">
										{chartRows.map((row) => (
											<span
												key={row.id}
												title={rowName(row)}
												className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground"
											>
												{rowName(row)}
											</span>
										))}
									</div>
								</div>
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
													className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap"
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
												className="whitespace-nowrap text-right"
											>
												<button
													type="button"
													onClick={() =>
														rules.setSort(rules.sort === "count-desc" ? "count-asc" : "count-desc")
													}
													className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap"
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
											<tr
												key={row.id}
												className={`border-b border-border/50 transition-opacity ${rules.isSelected(row) ? "bg-primary/10 outline-1 outline-primary -outline-offset-1" : ""}`}
											>
												<td className="py-2 pr-2">
													<button
														type="button"
														onClick={() => rules.toggleFocus(row)}
														aria-pressed={rules.isSelected(row)}
														className="cursor-pointer text-left hover:underline"
													>
														{rowName(row)}
													</button>
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
															title={`${m.viewOnMap}: ${rowName(row)}`}
															className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
														>
															<svg
																aria-hidden="true"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="1.5"
																className="size-4"
															>
																<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Zm0-15v15m6-12v15" />
															</svg>
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
