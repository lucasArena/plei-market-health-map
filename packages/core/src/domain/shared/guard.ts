import { ValidationError } from "@core/domain/shared/domain-error";
import type { GeoPoint } from "@core/domain/shared/geo-point.types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const guard = {
	notEmpty(value: string, field: string): string {
		const trimmed = value.trim();
		if (trimmed.length === 0) throw new ValidationError(`${field} must not be empty.`);
		return trimmed;
	},
	maxLength(value: string, max: number, field: string): string {
		if (value.length > max)
			throw new ValidationError(`${field} must be at most ${max} characters.`);
		return value;
	},
	location(point: GeoPoint, field: string): GeoPoint {
		const isLatitudeValid = point.latitude >= -90 && point.latitude <= 90;
		const isLongitudeValid = point.longitude >= -180 && point.longitude <= 180;
		if (!isLatitudeValid || !isLongitudeValid) {
			throw new ValidationError(`${field} must be a valid coordinate.`);
		}
		return { latitude: point.latitude, longitude: point.longitude };
	},
	email(value: string, field: string): string {
		const normalized = guard.notEmpty(value, field).toLowerCase();
		if (!EMAIL_PATTERN.test(normalized))
			throw new ValidationError(`${field} must be a valid email.`);
		return normalized;
	},
};
