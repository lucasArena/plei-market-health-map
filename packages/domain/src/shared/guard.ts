import { ValidationError } from "@domain/shared/domain-error";

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
	email(value: string, field: string): string {
		const normalized = guard.notEmpty(value, field).toLowerCase();
		if (!EMAIL_PATTERN.test(normalized))
			throw new ValidationError(`${field} must be a valid email.`);
		return normalized;
	},
};
