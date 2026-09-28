import type { AVATAR_SIZES } from "@/components/map/FacilityAvatar/FacilityAvatarComponent.styles";

export type FacilityAvatarSize = keyof typeof AVATAR_SIZES;

export interface FacilityAvatarProps {
	name: string;
	avatarUrl: string | null;
	size?: FacilityAvatarSize;
}
