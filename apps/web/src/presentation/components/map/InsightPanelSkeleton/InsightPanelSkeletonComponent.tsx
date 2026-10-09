import { AiSummarySkeleton } from "@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent";
import { INSIGHT_CONTAINER_CLASS } from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import {
	PANEL_CONTENT_CLASS,
	PANEL_SECTION_CLASS,
	PANEL_SECTIONS_CLASS,
} from "@/presentation/components/map/InsightPanel/InsightPanelComponent.styles";
import {
	SKELETON_BAR,
	SKELETON_DAY_PARTS,
	SKELETON_DAYS,
	SKELETON_GRIDLINES,
	SKELETON_LIST_ROWS,
	SKELETON_WEEKS,
} from "@/presentation/components/map/InsightPanelSkeleton/InsightPanelSkeletonComponent.styles";
import type {
	ChartModuleSkeletonProps,
	InsightPanelSkeletonProps,
	ListModuleSkeletonProps,
} from "@/presentation/components/map/InsightPanelSkeleton/InsightPanelSkeletonComponent.types";

function ModuleHeroSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-[5px]">
				<span className={`size-3.5 ${SKELETON_BAR}`} />
				<span className={`h-2.5 w-28 ${SKELETON_BAR}`} />
			</div>
			<div className="flex items-center gap-2">
				<span className="h-8 w-20 rounded-md bg-foreground/[0.07]" />
				<span className={`h-4 w-11 ${SKELETON_BAR}`} />
			</div>
			<span className={`h-2.5 w-40 ${SKELETON_BAR}`} />
		</div>
	);
}

function ChartModuleSkeleton({ rows, testId }: Readonly<ChartModuleSkeletonProps>) {
	return (
		<div
			data-testid={testId}
			data-boxed=""
			className={`${PANEL_SECTION_CLASS} ${INSIGHT_CONTAINER_CLASS} flex flex-col gap-3`}
		>
			<ModuleHeroSkeleton />
			<div className="flex flex-col gap-2">
				<div className="flex h-[130px] flex-col justify-between">
					{SKELETON_GRIDLINES.map((line) => (
						<div key={line} className="flex items-center gap-2">
							<span className="h-0 flex-1 border-t border-dashed border-foreground/[0.12]" />
							<span className={`h-2 w-7 ${SKELETON_BAR}`} />
						</div>
					))}
				</div>
				<div className="flex justify-between pr-9">
					{SKELETON_WEEKS.map((week) => (
						<span key={week} className={`h-2.5 w-9 ${SKELETON_BAR}`} />
					))}
				</div>
			</div>
			<ul className="flex flex-col">
				{Array.from({ length: rows }, (_, index) => `row-${index}`).map((key, index) => (
					<li
						key={key}
						className={`flex items-center justify-between gap-3 py-2 ${index > 0 ? "border-t border-foreground/[0.08]" : ""}`}
					>
						<span className="flex flex-col gap-1.5">
							<span className={`h-2.5 w-24 ${SKELETON_BAR}`} />
							<span className={`h-3 w-20 ${SKELETON_BAR}`} />
						</span>
						<span className={`h-4 w-14 ${SKELETON_BAR}`} />
					</li>
				))}
			</ul>
		</div>
	);
}

function ListModuleSkeleton({ testId }: Readonly<ListModuleSkeletonProps>) {
	return (
		<div
			data-testid={testId}
			data-boxed=""
			className={`${PANEL_SECTION_CLASS} ${INSIGHT_CONTAINER_CLASS} flex flex-col gap-3`}
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-[5px]">
					<span className={`size-3.5 ${SKELETON_BAR}`} />
					<span className={`h-2.5 w-24 ${SKELETON_BAR}`} />
				</div>
				<span className="h-8 w-14 rounded-md bg-foreground/[0.07]" />
				<span className={`h-2.5 w-16 ${SKELETON_BAR}`} />
			</div>
			<div className="flex justify-between">
				<span className={`h-2.5 w-14 ${SKELETON_BAR}`} />
				<span className={`h-2.5 w-24 ${SKELETON_BAR}`} />
			</div>
			<ul className="flex flex-col">
				{SKELETON_LIST_ROWS.map((row, index) => (
					<li
						key={row}
						className={`flex items-center gap-3 py-2 ${index > 0 ? "border-t border-foreground/[0.08]" : ""}`}
					>
						<span className="flex min-w-0 flex-1 flex-col gap-1.5">
							<span className={`h-3 w-28 ${SKELETON_BAR}`} />
							<span className={`h-2.5 w-20 ${SKELETON_BAR}`} />
						</span>
						<span className={`h-3 w-8 ${SKELETON_BAR}`} />
						<span className={`h-4 w-12 ${SKELETON_BAR}`} />
					</li>
				))}
			</ul>
		</div>
	);
}

function PopularTimesSkeleton() {
	return (
		<div
			data-testid="popular-times-skeleton"
			className={`${PANEL_SECTION_CLASS} flex flex-col gap-2`}
		>
			<span className={`h-4 w-44 ${SKELETON_BAR}`} />
			<div className="flex flex-col gap-1.5">
				{SKELETON_DAY_PARTS.map((part) => (
					<div key={part} className="flex items-center gap-1">
						<span className={`mr-1 h-2.5 w-12 ${SKELETON_BAR}`} />
						{SKELETON_DAYS.map((day) => (
							<span key={day} className="h-5 flex-1 rounded-md bg-foreground/[0.06]" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export function InsightPanelSkeleton({ level }: Readonly<InsightPanelSkeletonProps>) {
	const isFacility = level === "facility";
	return (
		<div
			data-testid="market-summary-skeleton"
			data-level={level}
			aria-hidden="true"
			className={`animate-pulse ${PANEL_CONTENT_CLASS}`}
		>
			<div className={PANEL_SECTIONS_CLASS}>
				{isFacility && (
					<div
						data-testid="facility-profile-skeleton"
						className={`${PANEL_SECTION_CLASS} flex items-center gap-3`}
					>
						<span className="size-8 rounded-full bg-foreground/[0.07]" />
						<span className={`h-3 w-48 ${SKELETON_BAR}`} />
					</div>
				)}
				<div className={PANEL_SECTION_CLASS}>
					<AiSummarySkeleton testId="insight-skeleton" isFlat />
				</div>
				<ChartModuleSkeleton testId="games-skeleton" rows={3} />
				<ChartModuleSkeleton testId="users-skeleton" rows={isFacility ? 1 : 3} />
				{isFacility && <PopularTimesSkeleton />}
				{level === "all" && <ListModuleSkeleton testId="markets-skeleton" />}
				{!isFacility && <ListModuleSkeleton testId="facilities-skeleton" />}
				<div className={PANEL_SECTION_CLASS}>
					<span className={`block h-2.5 w-36 ${SKELETON_BAR}`} />
				</div>
			</div>
		</div>
	);
}
