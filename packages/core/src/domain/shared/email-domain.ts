export function hasEmailDomain(email: string, domain: string): boolean {
	const normalized = email.trim().toLowerCase();
	const at = normalized.lastIndexOf("@");
	if (at <= 0) return false;
	return normalized.slice(at + 1) === domain.trim().toLowerCase();
}
