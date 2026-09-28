import type { FacilityMetrics, FacilityProps } from "@domain/entities/facility/facility.types";
import { ValidationError } from "@domain/shared/domain-error";
import { guard } from "@domain/shared/guard";
import type { EntityId } from "@domain/shared/id.types";

function assertMetrics(metrics: FacilityMetrics): FacilityMetrics {
	const counts = [metrics.activePlayers, metrics.gamesLastWeek];
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
		return { ...this.props, metrics: { ...this.props.metrics } };
	}
}
