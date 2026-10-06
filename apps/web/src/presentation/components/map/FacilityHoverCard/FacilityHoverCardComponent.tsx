import { Avatar } from "@/presentation/components/displays/Avatar/AvatarComponent";
import {
	formatHoverGamesBadge,
	useFacilityHoverCardRules,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.rules";
import {
	CLUSTER_HOVER_DIVIDER_CLASS,
	CLUSTER_HOVER_FOOTER_CLASS,
	CLUSTER_HOVER_GAMES_COUNT_CLASS,
	CLUSTER_HOVER_HEADING_CLASS,
	CLUSTER_HOVER_ITEM_CLASS,
	CLUSTER_HOVER_LIST_CLASS,
	CLUSTER_HOVER_NAME_CLASS,
	CLUSTER_HOVER_TREND_CLASS,
	FACILITY_HOVER_TEXT_CLASS,
	HOVER_TREND_LINE_CLASS,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.styles";
import type { FacilityHoverCardProps } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.types";
import { HOVER_CARD_WIDTH } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

export function FacilityHoverCard({
	hover,
	messages,
	onClusterPointerEnter,
	onClusterPointerLeave,
	onFacilitySelect,
}: Readonly<FacilityHoverCardProps>) {
	const {
		card,
		clusterCard,
		facilities,
		facilityCard,
		facilityTrend,
		finishReveal,
		labels,
		listFadeClass,
		listMaxHeight,
		listRef,
		motionClass,
		placement,
		selectListedFacility,
		showFacilityGames,
		surfaceClass,
		syncClusterListFade,
	} = useFacilityHoverCardRules(hover, messages, onFacilitySelect);

	if (!card || !placement) return null;

	return (
		<div
			role="tooltip"
			className="pointer-events-auto absolute z-10"
			onPointerEnter={onClusterPointerEnter}
			onPointerLeave={onClusterPointerLeave}
			style={{
				left: placement.left,
				top: placement.top,
				width: HOVER_CARD_WIDTH,
				transform: placement.transform,
			}}
		>
			<div
				onAnimationEnd={finishReveal}
				data-testid="cluster-hover-surface"
				className={`${surfaceClass} ${motionClass}`}
			>
				{
					{
						cluster: clusterCard && labels && (
							<>
								<p className={CLUSTER_HOVER_HEADING_CLASS}>{labels.title}</p>
								{labels.trend && (
									<p data-testid="cluster-hover-trend" className={CLUSTER_HOVER_TREND_CLASS}>
										{labels.trend}
									</p>
								)}
								{facilities.length > 0 && (
									<>
										<div
											aria-hidden
											data-testid="cluster-hover-divider"
											className={CLUSTER_HOVER_DIVIDER_CLASS}
										/>
										<ul
											ref={listRef}
											data-testid="cluster-hover-list"
											onScroll={syncClusterListFade}
											className={`${CLUSTER_HOVER_LIST_CLASS} ${listFadeClass}`}
											style={{ maxHeight: listMaxHeight }}
										>
											{facilities.map((facility) => (
												<li key={facility.id}>
													<button
														type="button"
														className={CLUSTER_HOVER_ITEM_CLASS}
														onClick={() => selectListedFacility(facility)}
													>
														<Avatar
															name={facility.name}
															avatarUrl={facility.avatarUrl}
															appearance="muted"
														/>
														<span className={CLUSTER_HOVER_NAME_CLASS}>{facility.name}</span>
														{showFacilityGames && (
															<span className={CLUSTER_HOVER_GAMES_COUNT_CLASS}>
																{formatHoverGamesBadge(facility.gamesLast28Days ?? 0)}
															</span>
														)}
													</button>
												</li>
											))}
										</ul>
									</>
								)}
								{labels.more && <p className={CLUSTER_HOVER_FOOTER_CLASS}>{labels.more}</p>}
							</>
						),
						facility: facilityCard && (
							<button
								type="button"
								className={CLUSTER_HOVER_ITEM_CLASS}
								onClick={() => selectListedFacility(facilityCard.facility)}
							>
								<Avatar
									name={facilityCard.facility.name}
									avatarUrl={facilityCard.facility.avatarUrl}
									appearance="muted"
								/>
								{facilityCard.games !== undefined || facilityTrend ? (
									<span className={FACILITY_HOVER_TEXT_CLASS}>
										<span className="flex min-w-0 items-center gap-2">
											<span className={CLUSTER_HOVER_NAME_CLASS}>{facilityCard.facility.name}</span>
											{facilityCard.games !== undefined && (
												<span className={CLUSTER_HOVER_GAMES_COUNT_CLASS}>
													{formatHoverGamesBadge(facilityCard.games)}
												</span>
											)}
										</span>
										{facilityTrend && (
											<span data-testid="facility-hover-trend" className={HOVER_TREND_LINE_CLASS}>
												{facilityTrend}
											</span>
										)}
									</span>
								) : (
									<span className={CLUSTER_HOVER_NAME_CLASS}>{facilityCard.facility.name}</span>
								)}
							</button>
						),
					}[card.kind]
				}
			</div>
		</div>
	);
}
