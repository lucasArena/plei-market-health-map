import type {
	GeoPoint,
	MarketHealthStatus,
	MarketMetrics,
	MarketProps,
} from "@domain/entities/market/market.types";
import { ValidationError } from "@domain/shared/domain-error";
import { guard } from "@domain/shared/guard";
import type { EntityId } from "@domain/shared/id.types";

export const MARKET_HEALTH_STATUSES = ["inactive", "at-risk", "watch", "healthy"] as const;
export const HEALTHY_SCORE = 70;
export const WATCH_SCORE = 40;

function assertLocation(location: GeoPoint): GeoPoint {
	const isLatitudeValid = location.latitude >= -90 && location.latitude <= 90;
	const isLongitudeValid = location.longitude >= -180 && location.longitude <= 180;
	if (!isLatitudeValid || !isLongitudeValid) {
		throw new ValidationError("Market location must be a valid coordinate.");
	}
	return { ...location };
}

const ISO_CODE_PATTERN = /^[A-Z]{3}$/;

function assertIsoCode(value: string, field: string): string {
	const code = value.trim().toUpperCase();
	if (!ISO_CODE_PATTERN.test(code)) throw new ValidationError(`${field} must be a 3-letter code.`);
	return code;
}

function assertMetrics(metrics: MarketMetrics): MarketMetrics {
	const counts = [metrics.activePlayers, metrics.gamesLastWeek, metrics.facilities];
	if (counts.some((value) => !Number.isInteger(value) || value < 0)) {
		throw new ValidationError("Market counts must be non-negative integers.");
	}
	if (metrics.healthScore < 0 || metrics.healthScore > 100) {
		throw new ValidationError("Market health score must be between 0 and 100.");
	}
	return { ...metrics };
}

export class Market {
	private constructor(private readonly props: MarketProps) {}

	static create(input: MarketProps): Market {
		return new Market({
			id: input.id,
			name: guard.notEmpty(input.name, "Market name"),
			state: guard.notEmpty(input.state, "Market state"),
			country: assertIsoCode(input.country, "Market country"),
			currency: assertIsoCode(input.currency, "Market currency"),
			location: assertLocation(input.location),
			metrics: assertMetrics(input.metrics),
		});
	}

	static restore(props: MarketProps): Market {
		return new Market({ ...props });
	}

	get id(): EntityId {
		return this.props.id;
	}

	get healthStatus(): MarketHealthStatus {
		const { healthScore, facilities } = this.props.metrics;
		const status = {
			[`${healthScore < WATCH_SCORE}`]: "at-risk",
			[`${healthScore >= WATCH_SCORE}`]: "watch",
			[`${healthScore >= HEALTHY_SCORE}`]: "healthy",
			[`${facilities === 0}`]: "inactive",
		}.true;
		return status as MarketHealthStatus;
	}

	toJSON(): MarketProps {
		return {
			...this.props,
			location: { ...this.props.location },
			metrics: { ...this.props.metrics },
		};
	}
}
