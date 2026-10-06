"use client";

import Link from "next/link";
import { DataTable } from "@/presentation/components/displays/DataTable/DataTableComponent";
import { AdminTabs } from "@/presentation/components/layout/AdminTabs/AdminTabsComponent";
import { useFeatureFlagsScreenRules } from "@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent.rules";

const SWITCH_TRACK = { on: "bg-pleiful-pitch-green-80", off: "bg-[#e5e5e5]" };
const SWITCH_THUMB = { on: "translate-x-4", off: "translate-x-0" };

export function FeatureFlagsScreen() {
	const { backToMapLabel, errorMessage, messages, pendingKey, rows, status, toggle } =
		useFeatureFlagsScreenRules();
	const columns = [
		{ key: "flag", label: messages.columnFlag },
		{ key: "status", label: messages.columnStatus },
		{ key: "lastChange", label: messages.columnLastChange },
	];

	return (
		<div className="absolute inset-0 overflow-y-auto">
			<div className="mx-auto max-w-4xl space-y-6 px-4 pt-20 pb-10">
				<AdminTabs active="featureFlags" />
				<header className="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h1 className="text-xl font-semibold">{messages.title}</h1>
						<p className="text-sm text-muted-foreground">{messages.subtitle}</p>
					</div>
					<Link
						href="/"
						className="text-sm font-medium text-pleiful-pitch-green-80 hover:underline"
					>
						{backToMapLabel}
					</Link>
				</header>
				{status === "loading" && (
					<div
						data-testid="feature-flags-skeleton"
						aria-hidden
						className="h-40 animate-pulse rounded-xl bg-muted"
					/>
				)}
				{status === "error" && (
					<p role="alert" className="text-sm text-destructive">
						{messages.failed}
					</p>
				)}
				{errorMessage && (
					<p role="alert" className="text-sm text-destructive">
						{errorMessage}
					</p>
				)}
				{status === "ready" && (
					<DataTable
						caption={messages.title}
						columns={columns}
						emptyLabel={messages.empty}
						rows={rows.map((row) => ({
							key: row.key,
							cells: {
								flag: (
									<div className="min-w-0">
										<p className="font-mono text-xs font-semibold">{row.key}</p>
										{row.description && (
											<p className="text-xs text-muted-foreground">{row.description}</p>
										)}
										{row.requirement && (
											<p className="text-xs text-muted-foreground italic">{row.requirement}</p>
										)}
									</div>
								),
								status: (
									<div className="flex items-center gap-2">
										<button
											type="button"
											role="switch"
											aria-checked={row.enabled}
											aria-label={row.toggleLabel}
											disabled={pendingKey === row.key}
											onClick={() => toggle(row)}
											className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-60 ${SWITCH_TRACK[row.state]}`}
										>
											<span
												className={`size-4 rounded-full bg-white shadow transition ${SWITCH_THUMB[row.state]}`}
											/>
										</button>
										<span className="text-xs">{row.statusLabel}</span>
									</div>
								),
								lastChange: <span className="text-xs text-muted-foreground">{row.lastChange}</span>,
							},
						}))}
					/>
				)}
			</div>
		</div>
	);
}
