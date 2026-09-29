import { FacilityAvatar } from "@/presentation/components/map/FacilityAvatar/FacilityAvatarComponent";
import { clusterLabels } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.rules";
import type { FacilityHoverCardProps } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.types";
import {
	HOVER_CARD_WIDTH,
	TOOLTIP_OFFSET,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

export function FacilityHoverCard({ hover, messages }: Readonly<FacilityHoverCardProps>) {
	const position = {
		left: hover.flipX ? hover.x - TOOLTIP_OFFSET : hover.x + TOOLTIP_OFFSET,
		top: hover.flipY ? hover.y - TOOLTIP_OFFSET : hover.y + TOOLTIP_OFFSET,
		transform: `translate(${hover.flipX ? "-100%" : "0"}, ${hover.flipY ? "-100%" : "0"})`,
	};

	if (hover.kind === "facility") {
		return (
			<div
				role="tooltip"
				className="pointer-events-none absolute z-10 flex items-center gap-2 rounded-lg border bg-background/95 py-1.5 pr-3 pl-1.5 shadow-lg backdrop-blur"
				style={position}
			>
				<FacilityAvatar name={hover.facility.name} avatarUrl={hover.facility.avatarUrl} />
				<span className="text-sm font-medium whitespace-nowrap">{hover.facility.name}</span>
			</div>
		);
	}

	const { title, more } = clusterLabels(hover, messages);
	return (
		<div
			role="tooltip"
			className="pointer-events-none absolute z-10 rounded-lg border bg-background/95 shadow-lg backdrop-blur"
			style={{ ...position, width: HOVER_CARD_WIDTH }}
		>
			<p className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">{title}</p>
			{hover.facilities.length > 0 && (
				<ul className="py-1">
					{hover.facilities.map((facility) => (
						<li key={facility.id} className="flex items-center gap-2 px-2 py-1">
							<FacilityAvatar name={facility.name} avatarUrl={facility.avatarUrl} />
							<span className="truncate text-sm">{facility.name}</span>
						</li>
					))}
				</ul>
			)}
			{more && <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">{more}</p>}
		</div>
	);
}
