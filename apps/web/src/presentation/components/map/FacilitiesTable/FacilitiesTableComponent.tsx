"use client";

import { PanelSection } from "@/presentation/components/displays/PanelSection/PanelSectionComponent";
import { useFacilitiesTableRules } from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent.rules";
import {
	FACILITY_CHANGE_ICON_PATH,
	FACILITY_CHANGE_PILL,
	FACILITY_STATUS_STYLE,
} from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent.styles";
import type { FacilitiesTableProps } from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent.types";

export function FacilitiesTable(props: Readonly<FacilitiesTableProps>) {
	const {
		canExpand,
		count,
		entries,
		expandLabel,
		isExpanded,
		messages,
		openFacility,
		toggleExpanded,
	} = useFacilitiesTableRules(props);

	return (
		<PanelSection title={messages.title} aside={count} testId="facilities-table">
			<div className="space-y-1">
				<div className="flex items-center gap-2.5 pr-2 pl-2.5 text-[11px] text-[#525866]">
					<span aria-hidden="true" className="w-3 shrink-0" />
					<span className="min-w-0 flex-1">{messages.columnFacility}</span>
					<span className="w-10 shrink-0 text-right">{messages.columnGames}</span>
					<span className="w-[58px] shrink-0 text-center">{messages.columnChange}</span>
					<span aria-hidden="true" className="w-1.5 shrink-0" />
				</div>
				<ul className="flex flex-col gap-0.5">
					{entries.map((entry, index) => {
						if (entry.kind === "label") {
							return (
								<li
									key={entry.key}
									className="pt-1 pl-2.5 text-[11px] font-semibold tracking-[0.02em] text-[#525866] uppercase"
								>
									{entry.label}
								</li>
							);
						}
						if (entry.kind === "gap") {
							return (
								<li key={entry.key} className="py-1">
									<button
										type="button"
										onClick={toggleExpanded}
										data-testid="facilities-table-gap"
										className="flex w-full items-center gap-2 text-[11px] text-[#525866] hover:text-[#1d1d1f] focus-visible:outline-2"
									>
										<span
											aria-hidden="true"
											className="h-px flex-1 border-t border-dashed border-black/15"
										/>
										{entry.label}
										<span
											aria-hidden="true"
											className="h-px flex-1 border-t border-dashed border-black/15"
										/>
									</button>
								</li>
							);
						}
						const { row } = entry;
						const statusStyle = FACILITY_STATUS_STYLE[row.status];
						const previous = entries[index - 1];
						return (
							<li
								key={entry.key}
								className={previous?.kind === "row" ? "border-t border-dashed border-black/10" : ""}
							>
								<button
									type="button"
									onClick={() => openFacility(row)}
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
											<span className={`font-semibold ${statusStyle.label}`}>
												{row.statusLabel}
											</span>
											{" · "}
											{row.previousLabel}
										</span>
									</span>
									<span className="w-10 shrink-0 text-right text-[13px] font-semibold text-[#1d1d1f] tabular-nums">
										{row.gamesLabel}
									</span>
									<span className="flex w-[58px] shrink-0 justify-center">
										{row.changeView && (
											<span
												className={`flex w-full items-center justify-center gap-0.5 rounded-full py-0.5 text-[11px] leading-[15px] font-semibold tabular-nums ${FACILITY_CHANGE_PILL[row.changeView.direction]}`}
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
													<path d={FACILITY_CHANGE_ICON_PATH[row.changeView.direction]} />
												</svg>
												{row.changeView.label}
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
		</PanelSection>
	);
}
