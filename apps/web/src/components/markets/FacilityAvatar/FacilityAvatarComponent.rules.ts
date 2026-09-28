export const AVATAR_COLORS = ["#047857", "#0369a1", "#7c3aed", "#b45309", "#be123c", "#0f766e"];

export function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
}

export function pickAvatarColor(name: string): string {
	const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return AVATAR_COLORS[sum % AVATAR_COLORS.length] as string;
}
