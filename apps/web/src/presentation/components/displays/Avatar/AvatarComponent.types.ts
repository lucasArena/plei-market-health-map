import type {
	AVATAR_APPEARANCE_CLASS,
	AVATAR_SIZES,
} from "@/presentation/components/displays/Avatar/AvatarComponent.styles";

export type AvatarSize = keyof typeof AVATAR_SIZES;

export type AvatarAppearance = keyof typeof AVATAR_APPEARANCE_CLASS;

export interface AvatarProps {
	name: string;
	avatarUrl: string | null;
	size?: AvatarSize;
	appearance?: AvatarAppearance;
}
