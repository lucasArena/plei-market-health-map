import type { AVATAR_SIZES } from "@/presentation/components/displays/Avatar/AvatarComponent.styles";

export type AvatarSize = keyof typeof AVATAR_SIZES;

export interface AvatarProps {
	name: string;
	avatarUrl: string | null;
	size?: AvatarSize;
}
