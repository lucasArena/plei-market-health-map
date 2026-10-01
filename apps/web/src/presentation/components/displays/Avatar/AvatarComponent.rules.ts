import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";

export const AVATAR_COLORS = ["#047857", "#0369a1", "#7c3aed", "#b45309", "#be123c", "#0f766e"];

export const MUTED_AVATAR_BACKGROUNDS = {
	"0": PLEIFUL_COLORS.pitchGreen[5],
	"1": PLEIFUL_COLORS.sky[10],
	"2": PLEIFUL_COLORS.moonlight[10],
	"3": PLEIFUL_COLORS.warning[10],
	"4": PLEIFUL_COLORS.orchid[10],
	"5": PLEIFUL_COLORS.informative[10],
	"6": PLEIFUL_COLORS.sangria[10],
	"7": PLEIFUL_COLORS.success[10],
} as const;

export function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
}

function nameColorIndex(name: string, size: number) {
	const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return sum % size;
}

export function pickAvatarColor(name: string): string {
	return AVATAR_COLORS[nameColorIndex(name, AVATAR_COLORS.length)] as string;
}

export function pickMutedAvatarColor(name: string) {
	const key = `${nameColorIndex(name, Object.keys(MUTED_AVATAR_BACKGROUNDS).length)}`;
	return MUTED_AVATAR_BACKGROUNDS[key as keyof typeof MUTED_AVATAR_BACKGROUNDS];
}
