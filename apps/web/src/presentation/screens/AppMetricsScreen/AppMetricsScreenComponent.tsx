"use client";

import Link from "next/link";
import { DataTable } from "@/presentation/components/displays/DataTable/DataTableComponent";
import { Pagination } from "@/presentation/components/displays/Pagination/PaginationComponent";
import { StatTiles } from "@/presentation/components/displays/StatTiles/StatTilesComponent";
import { WeeklyActivityChart } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent";
import { useAppMetricsScreenRules } from "@/presentation/screens/AppMetricsScreen/AppMetricsScreenComponent.rules";

export function AppMetricsScreen() {
	const { messages, page, pageCount, pageLabel, rows, setPage, status, view } =
		useAppMetricsScreenRules();
	const columns = [
		{ key: "person", label: messages.columnPerson },
		{ key: "days", label: messages.columnDays, align: "right" as const },
		{ key: "visits", label: messages.columnVisits, align: "right" as const },
		{ key: "minutes", label: messages.columnMinutes, align: "right" as const },
		{ key: "topFeature", label: messages.columnTopFeature },
		{ key: "lastSeen", label: messages.columnLastSeen },
	];

	return (
		<div className="absolute inset-0 overflow-y-auto">
			<div className="mx-auto max-w-4xl space-y-6 px-4 pt-20 pb-10">
				<header className="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h1 className="text-xl font-semibold">{messages.title}</h1>
						<p className="text-sm text-muted-foreground">{messages.subtitle}</p>
					</div>
					<Link
						href="/"
						className="text-sm font-medium text-pleiful-pitch-green-80 hover:underline"
					>
						{messages.backToMap}
					</Link>
				</header>
				{status === "loading" && (
					<div data-testid="app-metrics-skeleton" aria-hidden className="animate-pulse space-y-4">
						<div className="h-24 rounded-xl bg-muted" />
						<div className="h-40 rounded-xl bg-muted" />
					</div>
				)}
				{status === "error" && (
					<p role="alert" className="text-sm text-destructive">
						{messages.failed}
					</p>
				)}
				{status === "ready" && view && (
					<>
						<StatTiles tiles={view.tiles} testIdPrefix="app-metrics" />
						<div className="rounded-xl border bg-card p-4">
							<WeeklyActivityChart
								title={messages.chartTitle}
								legend={messages.chartLegend}
								points={view.weekly.all}
								secondary={{ legend: messages.chartTargetLegend, points: view.weekly.targets }}
							/>
						</div>
						<section aria-labelledby="app-metrics-people" className="space-y-3">
							<h2 id="app-metrics-people" className="text-sm font-semibold">
								{messages.tableTitle}
							</h2>
							<DataTable
								caption={messages.tableTitle}
								columns={columns}
								emptyLabel={messages.emptyTable}
								rows={rows.map((row) => ({
									key: row.key,
									cells: {
										person: (
											<div className="min-w-0">
												<p className="flex items-center gap-2 font-medium">
													<span className="truncate">{row.name}</span>
													{row.isTarget && (
														<span className="rounded-full bg-pleiful-pitch-green-10 px-2 py-0.5 text-[10px] font-semibold text-pleiful-pitch-green-80">
															{messages.targetBadge}
														</span>
													)}
												</p>
												{row.email && (
													<p className="truncate text-xs text-muted-foreground">{row.email}</p>
												)}
											</div>
										),
										days: row.days,
										visits: row.visits,
										minutes: row.minutes,
										topFeature: row.topFeature,
										lastSeen: row.lastSeen,
									},
								}))}
							/>
							<Pagination
								page={page}
								pageCount={pageCount}
								onPageChange={setPage}
								previousLabel={messages.previousPage}
								nextLabel={messages.nextPage}
								statusLabel={pageLabel}
							/>
						</section>
					</>
				)}
			</div>
		</div>
	);
}
