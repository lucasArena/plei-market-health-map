"use client";

import { Fragment } from "react";
import { useMarketsTableRules } from "@/presentation/components/map/MarketsTable/MarketsTableComponent.rules";
import {
	MARKET_CHANGE_ICON_PATH,
	MARKET_CHANGE_PILL,
	MARKET_STATUS_STYLE,
} from "@/presentation/components/map/MarketsTable/MarketsTableComponent.styles";
import type { MarketsTableProps } from "@/presentation/components/map/MarketsTable/MarketsTableComponent.types";

export function MarketsTable(props: Readonly<MarketsTableProps>) {
	const {
		canExpand,
		expandLabel,
		isExpanded,
		messages,
		note,
		openMarket,
		rows,
		setSort,
		sort,
		sortOptions,
		toggleExpanded,
	} = useMarketsTableRules(props);

	return (
		<div className="space-y-3" data-testid="markets-table">
			<div className="flex items-center gap-2.5">
				<span className="shrink-0 text-xs text-[#525866]">{messages.sortBy}</span>
				<fieldset className="flex min-w-0 flex-1 gap-0.5 rounded-full bg-[rgba(118,118,128,0.12)] p-0.5">
					<legend className="sr-only">{messages.sortBy}</legend>
					{sortOptions.map((option) => (
						<button
							key={option.key}
							type="button"
							aria-pressed={sort === option.key}
							onClick={() => setSort(option.key)}
							className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full py-[5px] text-xs leading-[15px] font-medium text-[#525866] transition-colors aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-[#1d1d1f] aria-pressed:shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
						>
							{option.label}
							{sort === option.key && (
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
									className="size-2.5"
								>
									<path d="M12 5v14m7-7-7 7-7-7" />
								</svg>
							)}
						</button>
					))}
				</fieldset>
			</div>
			<div className="space-y-1">
				<div className="flex items-center gap-2.5 pr-2 pl-2.5 text-[11px] text-[#525866]">
					<span aria-hidden="true" className="w-3 shrink-0" />
					<span className="min-w-0 flex-1">{messages.columnMarket}</span>
					<span className="w-10 shrink-0 text-right">{messages.columnGames}</span>
					<span className="w-[58px] shrink-0 text-center">{messages.columnChange}</span>
					<span aria-hidden="true" className="w-1.5 shrink-0" />
				</div>
				<ul className="flex flex-col gap-0.5">
					{rows.map((row, index) => {
						const statusStyle = MARKET_STATUS_STYLE[row.status ?? "pending"];
						return (
							<Fragment key={row.id}>
								{index > 0 && (
									<li aria-hidden="true" className="border-t border-dashed border-black/10" />
								)}
								<li>
									<button
										type="button"
										onClick={() => openMarket(row)}
										aria-label={row.openLabel}
										className="flex w-full items-center gap-2.5 rounded-xl py-1.5 pr-2 pl-2.5 text-left transition-[background-color,box-shadow] hover:bg-white hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-pleiful-pitch-green-50"
									>
										<span aria-hidden="true" className="relative size-3 shrink-0">
											<span className={`absolute inset-0 rounded-full ${statusStyle.halo}`} />
											<span
												className={`absolute top-0.5 left-0.5 size-2 rounded-full ${statusStyle.dot}`}
											/>
										</span>
										<span className="flex min-w-0 flex-1 flex-col gap-px">
											<span className="truncate text-[13px] leading-4 font-medium text-[#1d1d1f]">
												{row.name}
											</span>
											<span className="truncate text-[11px] leading-[14px] text-[#525866]">
												{row.statusLabel && (
													<span className={`font-semibold ${statusStyle.label}`}>
														{row.statusLabel}
														{" · "}
													</span>
												)}
												{row.activeLabel}
											</span>
										</span>
										<span className="w-10 shrink-0 text-right text-[13px] font-semibold text-[#1d1d1f] tabular-nums">
											{row.gamesLabel}
										</span>
										<span className="flex w-[58px] shrink-0 justify-center">
											{row.change && (
												<span
													className={`flex w-full items-center justify-center gap-0.5 rounded-full py-0.5 text-[11px] leading-[15px] font-semibold tabular-nums ${MARKET_CHANGE_PILL[row.change.direction]}`}
												>
													<svg
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2.5"
														strokeLinecap="round"
														strokeLinejoin="round"
														aria-hidden="true"
														className="size-2.5 shrink-0"
													>
														<path d={MARKET_CHANGE_ICON_PATH[row.change.direction]} />
													</svg>
													{row.change.label}
												</span>
											)}
										</span>
										<svg
											viewBox="0 0 6 10"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
											aria-hidden="true"
											className="h-2.5 w-1.5 shrink-0 text-[#525866]"
										>
											<path d="m1 1 4 4-4 4" />
										</svg>
									</button>
								</li>
							</Fragment>
						);
					})}
				</ul>
				{canExpand && (
					<div className="flex justify-center pt-1">
						<button
							type="button"
							onClick={toggleExpanded}
							aria-expanded={isExpanded}
							className="rounded-full border border-[#d3d5d8] bg-white/90 px-3 py-1 text-xs font-medium text-[#525866] shadow-sm transition-colors hover:bg-white"
						>
							{expandLabel}
						</button>
					</div>
				)}
			</div>
			<p className="text-[11px] text-[#525866]">{note}</p>
		</div>
	);
}
