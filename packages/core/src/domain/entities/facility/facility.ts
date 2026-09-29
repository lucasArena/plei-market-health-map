import type { FacilityMetrics, FacilityProps } from "@core/domain/entities/facility/facility.types";
import { ValidationError } from "@core/domain/shared/domain-error";
import { guard } from "@core/domain/shared/guard";
import type { EntityId } from "@core/domain/shared/id.types";

function assertMetrics(metrics: FacilityMetrics): FacilityMetrics {
	const counts = [metrics.activePlayers, metrics.gamesLastWeek, metrics.gamesLast28Days];
	if (counts.some((value) => !Number.isInteger(value) || value < 0)) {
		throw new ValidationError("Facility counts must be non-negative integers.");
	}
	if (metrics.utilization < 0 || metrics.utilization > 100) {
		throw new ValidationError("Facility utilization must be between 0 and 100.");
	}
	return { ...metrics };
}

export class Facility {
	private constructor(private readonly props: FacilityProps) {}

	static create(input: FacilityProps): Facility {
		return new Facility({
			id: input.id,
			marketId: input.marketId,
			name: guard.notEmpty(input.name, "Facility name"),
			address: guard.notEmpty(input.address, "Facility address"),
			location: guard.location(input.location, "Facility location"),
			avatarUrl: input.avatarUrl?.trim() || null,
			metrics: assertMetrics(input.metrics),
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

	toJSON(): FacilityProps {
		return {
			...this.props,
			location: { ...this.props.location },
			metrics: { ...this.props.metrics },
		};
	}
}
