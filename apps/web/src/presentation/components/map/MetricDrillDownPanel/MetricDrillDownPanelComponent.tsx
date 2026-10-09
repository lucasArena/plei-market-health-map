"use client";

import type {
	DrillDownComparison,
	DrillDownMeasure,
	DrillDownRange,
	DrillDownSegment,
} from "@market-health-map/core/application";
import { MapMetricSelect } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent";
import { useMetricDrillDownPanelRules } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.rules";
import {
	DRILL_DOWN_BAR_CLASS,
	DRILL_DOWN_BAR_TOP_CLASS,
	DRILL_DOWN_COLORS,
	DRILL_DOWN_EXPAND_BUTTON_CLASS,
	DRILL_DOWN_EXPANDED_PANEL_CLASS,
	DRILL_DOWN_PANEL_CLASS,
	DRILL_DOWN_SKELETON_CLASS,
	drillDownGlassColor,
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
			<div className="flex flex-wrap items-start justify-between gap-2 px-5 pt-5">
				<div className="min-w-0 flex-1 basis-36">
					<h2 className="text-base font-semibold">{m.title}</h2>
					<p className="text-xs text-muted-foreground">{rules.heading}</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<MapMetricSelect
						label={m.range}
						help={m.rangeHelp}
						value={rules.range}
						variant="pill"
						alignRight
						onChange={(value) => rules.setRange(value as DrillDownRange)}
						options={[
							{ value: "7d", label: m.range7d },
							{ value: "28d", label: m.range28d },
							{ value: "90d", label: m.range90d },
							{ value: "6m", label: m.range6m },
							{ value: "12m", label: m.range12m },
						]}
					/>
					{!rules.isTime && (
						<MapMetricSelect
							variant="pill"
							alignRight
							label={m.compare}
							help={rules.comparisonHelp}
							value={rules.comparison}
							selectedLabel={rules.comparisonLabel}
							onChange={(value) => rules.setComparison(value as DrillDownComparison)}
							options={[
								{ value: "week", label: "WoW", tooltip: m.compareWeek },
								{ value: "month", label: "MoM", tooltip: m.compareMonth },
								{ value: "year", label: "YoY", tooltip: m.compareYear },
							]}
						/>
					)}
					<button
						ref={rules.expandButtonRef}
						type="button"
						onClick={rules.toggleExpanded}
						aria-label={rules.isExpanded ? m.collapse : m.expand}
						title={rules.isExpanded ? m.collapse : m.expand}
						aria-pressed={rules.isExpanded}
						className={DRILL_DOWN_EXPAND_BUTTON_CLASS}
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
				</div>
			</div>
			<div className="min-h-0 shrink space-y-4 overflow-y-auto p-5 pt-3">
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
					{rules.isLoading ? (
						<div aria-hidden="true" className={`${DRILL_DOWN_SKELETON_CLASS} mb-1 h-8 w-24`} />
					) : (
						<p className="text-3xl font-semibold tabular-nums">
							{rules.isError ? "—" : formatValue(rules.headlineValue)}
						</p>
					)}
					<p className="text-xs">{rules.measureLabel}</p>
					{!rules.isTime && !rules.isLoading && !rules.isError && (
						<p
							data-testid="drill-down-headline-change"
							className="mt-1 text-xs font-normal tabular-nums text-foreground"
						>
							<span
								style={{ color: rules.headlineChange.color }}
								className={rules.headlineChange.className}
							>
								{rules.headlineChange.label}
							</span>
							{rules.headlineChange.countLabel && <span> {rules.headlineChange.countLabel}</span>}
						</p>
					)}
					{!rules.isLoading && !rules.isError && rules.headlineParts && (
						<p className="mt-1 text-xs tabular-nums text-muted-foreground">{rules.headlineParts}</p>
					)}
					{rules.isLoading ? (
						<div aria-hidden="true" className={`${DRILL_DOWN_SKELETON_CLASS} mt-1 h-4 w-48`} />
					) : (
						<p className="mt-1 text-xs text-muted-foreground">{rules.dateRange}</p>
					)}
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
							{ value: "games", label: m.games, tooltip: m.measureTips.games },
							{
								value: "avg-daily-games",
								label: m.avgDailyGames,
								tooltip: m.measureTips.avgDailyGames,
							},
							{
								value: "scheduled-games",
								label: m.scheduledGames,
								tooltip: m.measureTips.scheduledGames,
							},
							{
								value: "incident-games-rate",
								label: m.incidentGamesRate,
								tooltip: m.measureTips.incidentGamesRate,
							},
							{
								value: "confirmation-rate",
								label: m.confirmationRate,
								tooltip: m.measureTips.confirmationRate,
							},
							{
								value: "almost-filled-rate",
								label: m.almostFilledRate,
								tooltip: m.measureTips.almostFilledRate,
							},
							{
								value: "registrations",
								label: m.registrations,
								tooltip: m.measureTips.registrations,
							},
							{ value: "unique-users", label: m.uniqueUsers, tooltip: m.measureTips.uniqueUsers },
							{
								value: "activated-players",
								label: m.activatedPlayers,
								tooltip: m.measureTips.activatedPlayers,
							},
							{
								value: "unique-players",
								label: m.uniquePlayers,
								tooltip: m.measureTips.uniquePlayers,
							},
							{
								value: "active-organizers",
								label: m.activeOrganizers,
								tooltip: m.measureTips.activeOrganizers,
							},
							{
								value: "active-facilities",
								label: m.activeFacilities,
								tooltip: m.measureTips.activeFacilities,
							},
						]}
					/>
					<MapMetricSelect
						label={m.slice}
						help={m.sliceHelp}
						value={rules.sliceValue}
						onChange={rules.setSliceValue}
						options={[
							{ value: "market", label: m.market },
							{
								value: "time",
								label: m.time,
								children: [
									{ value: "time:day", label: m.day },
									{ value: "time:week", label: m.week },
									{ value: "time:month", label: m.month },
								],
							},
							...(!rules.isAppActivity ? [{ value: "facility", label: m.facility }] : []),
							...(rules.canSliceByDepartment ? [{ value: "department", label: m.department }] : []),
							...(rules.canSliceByOrganizer ? [{ value: "organizer", label: m.organizer }] : []),
						]}
					/>
					{!rules.isAppActivity && (
						<MapMetricSelect
							label={m.segment}
							help={m.segmentHelp}
							value={segment}
							disabled={!rules.canSegment}
							descriptionId={!rules.canSegment ? "drill-down-segment-help" : undefined}
							onChange={(value) => rules.setSegment(value as DrillDownSegment)}
							options={[
								{ value: "none", label: m.none },
								{ value: "department", label: m.department },
								{ value: "organizer", label: m.organizer },
							]}
						/>
					)}
				</div>
				{rules.isAppActivity && (
					<p className="text-xs text-muted-foreground">{m.appActivityNote}</p>
				)}
				{rules.showSourceSwitch && (
					<p role="note" className="text-xs text-muted-foreground">
						{m.sourceSwitch}
					</p>
				)}
				{!rules.isAppActivity && <p className="text-xs text-muted-foreground">{m.help}</p>}
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
				{!rules.canSegment && !rules.isAppActivity && (
					<p id="drill-down-segment-help" className="text-xs text-muted-foreground">
						{m.segmentUnavailable}
					</p>
				)}
				{rules.isLoading && (
					<div role="status">
						<span className="sr-only">{m.loading}</span>
						<div aria-hidden="true" data-testid="drill-down-skeleton" className="space-y-4">
							<div
								className={`flex items-end gap-4 border-b border-border px-4 pb-1 ${rules.isExpanded ? "h-80" : "h-52"}`}
							>
								{[45, 70, 55, 85, 60].map((height) => (
									<div
										key={height}
										className={`${DRILL_DOWN_SKELETON_CLASS} flex-1 rounded-b-none`}
										style={{ height: `${height}%` }}
									/>
								))}
							</div>
							<div className="space-y-3">
								{[0, 1, 2, 3].map((row) => (
									<div key={row} className="flex justify-between gap-4 border-b border-border pb-3">
										<div className={`${DRILL_DOWN_SKELETON_CLASS} h-4 w-1/2`} />
										<div className={`${DRILL_DOWN_SKELETON_CLASS} h-4 w-12`} />
									</div>
								))}
							</div>
						</div>
					</div>
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
						{rules.dataErrorsMessage && (
							<p role="alert" className="text-xs text-pleiful-sangria-50">
								{rules.dataErrorsMessage}
							</p>
						)}
						{rules.showReviewsLag && (
							<p className="text-xs text-muted-foreground">{m.reviewsLag}</p>
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
								{segment === "organizer" && (
									<div className="flex flex-wrap gap-3 text-[11px]">
										{rules.organizers.map((organizer) => (
											<span key={organizer.id} className="flex items-center gap-1">
												<span
													aria-hidden="true"
													className="size-2 rounded-full"
													style={{ backgroundColor: rules.organizerColor(organizer.id) }}
												/>
												{organizer.name}
											</span>
										))}
									</div>
								)}
								<div className="overflow-x-auto pt-2 pb-3">
									<div
										className="relative pr-14"
										style={
											rules.isTime
												? { minWidth: `${Math.max(300, chartRows.length * 42)}px` }
												: undefined
										}
									>
										<div className={`relative ${rules.isExpanded ? "h-80" : "h-52"}`}>
											<div aria-hidden="true" className="absolute inset-0">
												{rules.ticks.map((tick) => (
													<div
														key={tick}
														className="absolute inset-x-0 border-t border-dashed border-foreground/15"
														style={{ bottom: `${(tick / rules.max) * 100}%` }}
													>
														<span className="absolute -right-14 -translate-y-1/2 w-12 text-right text-[10px] tabular-nums text-muted-foreground">
															{formatValue(tick)}
														</span>
													</div>
												))}
											</div>
											{rules.isTime &&
												rules.showSourceSwitch &&
												rules.sourceSwitchPosition !== undefined && (
													<div
														role="note"
														aria-label={m.sourceSwitch}
														className="absolute inset-y-0 z-10 border-l border-dashed border-foreground/60"
														style={{ left: `${rules.sourceSwitchPosition}%` }}
													>
														<span className="absolute top-0 left-1 text-[10px] whitespace-nowrap bg-background/90 px-1">
															2026-06-29
														</span>
													</div>
												)}
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
																	onClick={() =>
																		rules.toggleFocus(row, {
																			department: bar.department,
																			organizerId: bar.organizerId,
																		})
																	}
																	aria-pressed={rules.isSelected(row, {
																		department: bar.department,
																		organizerId: bar.organizerId,
																	})}
																	aria-label={bar.label}
																	style={{
																		height: `${bar.height}%`,
																		backgroundColor:
																			bar.value === 0
																				? "transparent"
																				: drillDownGlassColor(bar.color),
																	}}
																	className={`${DRILL_DOWN_BAR_CLASS} ${bar.isTop ? DRILL_DOWN_BAR_TOP_CLASS : ""}`}
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
													className="group inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
												>
													{m[selection.slice]}
													<svg
														aria-hidden="true"
														viewBox="0 0 16 16"
														fill="none"
														stroke="currentColor"
														strokeWidth="1.25"
														strokeLinecap="round"
														strokeLinejoin="round"
														className={`size-3 shrink-0 text-muted-foreground ${rules.sort.startsWith("name") ? "opacity-80" : "opacity-0 group-hover:opacity-40 group-focus-visible:opacity-40"}`}
													>
														<path
															d={rules.sort === "name-asc" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"}
														/>
													</svg>
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
													className="group inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
												>
													{rules.valueLabel}
													<svg
														aria-hidden="true"
														viewBox="0 0 16 16"
														fill="none"
														stroke="currentColor"
														strokeWidth="1.25"
														strokeLinecap="round"
														strokeLinejoin="round"
														className={`size-3 shrink-0 text-muted-foreground ${rules.sort.startsWith("count") ? "opacity-80" : "opacity-0 group-hover:opacity-40 group-focus-visible:opacity-40"}`}
													>
														<path
															d={rules.sort === "count-asc" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"}
														/>
													</svg>
												</button>
											</th>
											{!rules.isTime && (
												<th
													className="px-2 text-right whitespace-nowrap font-normal"
													aria-sort={
														rules.sort === "change-asc"
															? "ascending"
															: rules.sort === "change-desc"
																? "descending"
																: "none"
													}
												>
													<button
														type="button"
														className="cursor-pointer"
														onClick={() =>
															rules.setSort(
																rules.sort === "change-desc" ? "change-asc" : "change-desc",
															)
														}
													>
														{m.change}{" "}
														{rules.sort.startsWith("change")
															? rules.sort === "change-asc"
																? "↑"
																: "↓"
															: ""}
													</button>
												</th>
											)}
											{segment === "department" &&
												rules.departments.map((department) => (
													<th key={department} className="px-2 text-right">
														{departmentNames[department]}
													</th>
												))}
											{segment === "organizer" &&
												rules.organizers.map((organizer) => (
													<th key={organizer.id} className="px-2 text-right">
														{organizer.name}
													</th>
												))}
											{selection.slice !== "department" && !rules.isTime && (
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
												aria-selected={rules.isSelected(row)}
												tabIndex={0}
												onClick={() => rules.toggleFocus(row)}
												onKeyDown={(event) => {
													if (
														event.target === event.currentTarget &&
														(event.key === "Enter" || event.key === " ")
													) {
														event.preventDefault();
														rules.toggleFocus(row);
													}
												}}
												className={`cursor-pointer border-b border-border/30 transition-colors hover:bg-foreground/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${rules.isSelected(row) ? "bg-primary/[0.06]" : ""}`}
											>
												<td className="py-3 pl-3 pr-2">{rowName(row)}</td>
												<td className="text-right tabular-nums">
													{formatValue(row.value)}
													{rules.rateParts(row) && (
														<span className="block text-[10px] text-muted-foreground">
															{rules.rateParts(row)}
														</span>
													)}
												</td>
												{!rules.isTime && (
													<td className="px-2 text-right whitespace-nowrap font-normal tabular-nums text-foreground">
														<span
															style={{
																color: rules.changeDisplay(row.value, row.previousValue).color,
															}}
															className={
																rules.changeDisplay(row.value, row.previousValue).className
															}
														>
															{rules.changeDisplay(row.value, row.previousValue).label}
														</span>
														{rules.changeDisplay(row.value, row.previousValue).countLabel && (
															<span>
																{" "}
																{rules.changeDisplay(row.value, row.previousValue).countLabel}
															</span>
														)}
													</td>
												)}
												{segment === "department" &&
													rules.departments.map((department) => (
														<td key={department} className="px-2 text-right tabular-nums">
															{formatValue(row.departments?.[department] ?? null)}
															{row.departmentParts?.[department] && (
																<span className="block text-[10px] text-muted-foreground">
																	{rules.rateParts(row.departmentParts[department])}
																</span>
															)}
														</td>
													))}
												{segment === "organizer" &&
													rules.organizers.map((organizer) => {
														const cell = row.organizers?.find((item) => item.id === organizer.id);
														return (
															<td key={organizer.id} className="px-2 text-right tabular-nums">
																{formatValue(cell?.value ?? null)}
																{cell && rules.rateParts(cell) && (
																	<span className="block text-[10px] text-muted-foreground">
																		{rules.rateParts(cell)}
																	</span>
																)}
															</td>
														);
													})}
												{selection.slice !== "department" && !rules.isTime && (
													<td className="py-2 pl-3 text-right">
														<button
															type="button"
															onClick={(event) => {
																event.stopPropagation();
																rules.viewOnMap(row);
															}}
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
