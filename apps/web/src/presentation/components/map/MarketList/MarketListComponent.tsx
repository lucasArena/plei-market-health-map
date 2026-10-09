"use client";

import { MetricHero } from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent";
import { SortIcon } from "@/presentation/components/displays/SortIcon/SortIconComponent";
import {
	CHANGE_BADGE_CLASS,
	CHANGE_BADGE_ICON_CLASS,
} from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import { useMarketListRules } from "@/presentation/components/map/MarketList/MarketListComponent.rules";
import {
	MARKET_CHANGE_PILL_CLASS,
	MARKET_LIST_BODY_CLASS,
	MARKET_LIST_CARD_CLASS,
	MARKET_LIST_CTA_CLASS,
	MARKET_LIST_HEADER_ROW_CLASS,
	MARKET_LIST_NAME_CLASS,
	MARKET_LIST_NUMBER_CELL_CLASS,
	MARKET_LIST_ROW_CLASS,
	MARKET_LIST_ROW_ITEM_CLASS,
	MARKET_LIST_ROWS_CLASS,
	MARKET_LIST_SECONDARY_TEXT_CLASS,
	MARKET_LIST_SORT_BUTTON_CLASS,
} from "@/presentation/components/map/MarketList/MarketListComponent.styles";
import {
	type MarketListProps,
	type MarketListRowView,
	MarketListSort,
	type MarketListSortOrder,
} from "@/presentation/components/map/MarketList/MarketListComponent.types";

const ICON_PROPS = {
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2.5,
	strokeLinecap: "round",
	strokeLinejoin: "round",
} as const;

/** lucide arrow-down-right / arrow-up-right / arrow-right */
function ChangeArrow({ direction }: Readonly<{ direction: MarketListRowView["changeDirection"] }>) {
	if (!direction) return null;
	const path = {
		down: "m7 7 10 10M17 7v10H7",
		up: "M7 7h10v10M7 17 17 7",
		flat: "M5 12h14m-7-7 7 7-7 7",
	}[direction];
	return (
		<svg aria-hidden="true" {...ICON_PROPS} className={CHANGE_BADGE_ICON_CLASS}>
			<path d={path} />
		</svg>
	);
}

/**
 * lucide chevron-right in a 12px box with a 1.5px stroke (non-scaling, so it
 * stays 1.5px at this size): smaller and thinner than the old 6×10 / ~1.7px one.
 * Light gray #9ca3af: decorative and aria-hidden, the row's text carries meaning.
 */
function RowChevron() {
	return (
		<svg
			aria-hidden="true"
			data-testid="market-row-chevron"
			{...ICON_PROPS}
			strokeWidth={1.5}
			width={12}
			height={12}
			className="shrink-0 text-[#9ca3af]"
		>
			<path d="m9 18 6-6-6-6" vectorEffect="non-scaling-stroke" />
		</svg>
	);
}

function MarketRow({
	row,
	onSelect,
}: Readonly<{
	row: MarketListRowView;
	onSelect: MarketListProps["onSelect"];
}>) {
	return (
		<button
			type="button"
			onClick={() => onSelect(row)}
			aria-label={row.ariaLabel}
			className={MARKET_LIST_ROW_CLASS}
		>
			<span className="flex min-w-0 flex-1 flex-col gap-px">
				<span className={MARKET_LIST_NAME_CLASS}>{row.name}</span>
				{row.detail && (
					<span
						data-testid="market-row-detail"
						className={`truncate text-[11px] leading-[14px] ${MARKET_LIST_SECONDARY_TEXT_CLASS}`}
					>
						{row.detail}
					</span>
				)}
			</span>
			<span className={MARKET_LIST_NUMBER_CELL_CLASS}>{row.gamesLabel}</span>
			<span className="flex w-[58px] shrink-0 justify-center">
				<span
					data-testid="market-row-change"
					className={`${CHANGE_BADGE_CLASS} ${MARKET_CHANGE_PILL_CLASS[row.changeDirection ?? "unknown"]}`}
				>
					<ChangeArrow direction={row.changeDirection} />
					{row.changeLabel}
				</span>
			</span>
			<RowChevron />
		</button>
	);
}

function MarketRows({
	rows,
	titleId,
	onSelect,
}: Readonly<{
	rows: readonly MarketListRowView[];
	titleId: string;
	onSelect: MarketListProps["onSelect"];
}>) {
	return (
		<ul aria-labelledby={titleId} className={MARKET_LIST_ROWS_CLASS}>
			{rows.map((row) => (
				<li key={row.key} className={MARKET_LIST_ROW_ITEM_CLASS}>
					<MarketRow row={row} onSelect={onSelect} />
				</li>
			))}
		</ul>
	);
}

/** lucide chevron-down; flips up while expanded */
function CtaChevron({ isExpanded }: Readonly<{ isExpanded: boolean }>) {
	return (
		<svg
			aria-hidden="true"
			{...ICON_PROPS}
			className={`size-3 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

/** Staging-style sortable column header: label plus the shared SortIcon chevron, current order for screen readers. */
function SortHeader({
	label,
	column,
	sort,
	order,
	messages,
	onSort,
	className,
}: Readonly<{
	label: string;
	column: MarketListSort;
	sort: MarketListSort;
	order: MarketListSortOrder;
	messages: MarketListProps["messages"];
	onSort: (column: MarketListSort) => void;
	className: string;
}>) {
	const isActive = column === sort;
	return (
		<span className={className}>
			<button
				type="button"
				aria-pressed={isActive}
				onClick={() => onSort(column)}
				className={MARKET_LIST_SORT_BUTTON_CLASS}
			>
				{label}
				<SortIcon isActive={isActive} direction={order} />
				{isActive && (
					<span className="sr-only">
						{order === "desc" ? messages.sortDescending : messages.sortAscending}
					</span>
				)}
			</button>
		</span>
	);
}

export function MarketList({
	rows,
	emptyLabel,
	seeAllLabel,
	messages,
	hero,
	locale,
	kind = "markets",
	onSelect,
}: Readonly<MarketListProps>) {
	const isMarkets = kind === "markets";
	const titleId = isMarkets ? "market-list-title" : "facility-list-title";
	const {
		isCollapsible,
		isExpanded,
		listId,
		order,
		selectSort,
		sort,
		toggleExpanded,
		visibleRows,
	} = useMarketListRules(rows, locale);

	return (
		<section aria-labelledby={titleId} className={MARKET_LIST_CARD_CLASS}>
			<MetricHero
				testIdPrefix={isMarkets ? "markets" : "facilities"}
				titleId={titleId}
				icon={kind}
				title={isMarkets ? messages.activeMarkets : messages.activeFacilities}
				hero={hero}
				noPreviousLabel={messages.gamesNoPrevious}
				showChange={false}
			/>
			{rows.length === 0 ? (
				<p className={`text-xs ${MARKET_LIST_SECONDARY_TEXT_CLASS}`}>{emptyLabel}</p>
			) : (
				<div className={MARKET_LIST_BODY_CLASS}>
					<fieldset
						data-testid={isMarkets ? "market-list-header" : "facility-list-header"}
						className={MARKET_LIST_HEADER_ROW_CLASS}
					>
						<legend className="sr-only">
							{isMarkets ? messages.sortMarketsBy : messages.sortFacilitiesBy}
						</legend>
						<SortHeader
							label={isMarkets ? messages.columnMarket : messages.columnFacility}
							column={MarketListSort.name}
							sort={sort}
							order={order}
							messages={messages}
							onSort={selectSort}
							className="min-w-0 flex-1"
						/>
						<SortHeader
							label={messages.columnGames}
							column={MarketListSort.games}
							sort={sort}
							order={order}
							messages={messages}
							onSort={selectSort}
							className="flex w-12 shrink-0 justify-end"
						/>
						<SortHeader
							label={messages.columnChange}
							column={MarketListSort.change}
							sort={sort}
							order={order}
							messages={messages}
							onSort={selectSort}
							className="flex w-[58px] shrink-0 justify-center"
						/>
						{/* Chevron column (12px). */}
						<span aria-hidden="true" className="w-3 shrink-0" />
					</fieldset>
					<div id={listId} className="flex flex-col">
						<MarketRows rows={visibleRows} titleId={titleId} onSelect={onSelect} />
					</div>
					{isCollapsible && (
						<div className="pt-1">
							<button
								type="button"
								aria-expanded={isExpanded}
								aria-controls={listId}
								onClick={toggleExpanded}
								className={MARKET_LIST_CTA_CLASS}
							>
								{isExpanded ? messages.showLessMarkets : seeAllLabel}
								<CtaChevron isExpanded={isExpanded} />
							</button>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
