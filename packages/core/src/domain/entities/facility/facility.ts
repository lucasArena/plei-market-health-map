import type { FacilityMetrics, FacilityProps } from "@core/domain/entities/facility/facility.types";
import { ValidationError } from "@core/domain/shared/domain-error";
import { guard } from "@core/domain/shared/guard";
import type { EntityId } from "@core/domain/shared/id.types";

function assertMetrics(metrics: FacilityMetrics): FacilityMetrics {
	const counts = [
		metrics.activePlayers,
		metrics.gamesLastWeek,
		metrics.gamesLast28Days,
		...Object.values(metrics.gamesByDepartment ?? {}),
	];
	if (counts.some((value) => !Number.isInteger(value) || value < 0)) {
		throw new ValidationError("Facility counts must be non-negative integers.");
	}
	if (metrics.utilization < 0 || metrics.utilization > 100) {
		throw new ValidationError("Facility utilization must be between 0 and 100.");
	}
	return { ...metrics };
}

function memberIdsWith(id: EntityId, memberIds: EntityId[] = []): EntityId[] {
	return [...new Set([id, ...memberIds])];
}

export class Facility {
	private constructor(private readonly props: FacilityProps) {}

	static create(input: FacilityProps): Facility {
		return new Facility({
			id: input.id,
			marketId: input.marketId,
			marketName: guard.notEmpty(input.marketName ?? input.marketId, "Market name"),
			name: guard.notEmpty(input.name, "Facility name"),
			address: guard.notEmpty(input.address, "Facility address"),
			location: guard.location(input.location, "Facility location"),
			avatarUrl: input.avatarUrl?.trim() || null,
			metrics: assertMetrics(input.metrics),
			memberIds: memberIdsWith(input.id, input.memberIds),
		});
	}

	static restore(props: FacilityProps): Facility {
		return new Facility({ ...props });
	}

	get id(): EntityId {
		return this.props.id;
	}

	get marketId(): EntityId {
		return this.props.marketId;
	}

	get marketName(): string {
		return this.props.marketName ?? this.props.marketId;
	}

	get memberIds(): EntityId[] {
		return memberIdsWith(this.props.id, this.props.memberIds);
	}

	toJSON(): FacilityProps {
		const { memberIds, ...props } = this.props;
		return {
			...props,
			location: { ...props.location },
			metrics: { ...props.metrics },
			...(memberIds ? { memberIds: [...memberIds] } : {}),
		};
	}
}
