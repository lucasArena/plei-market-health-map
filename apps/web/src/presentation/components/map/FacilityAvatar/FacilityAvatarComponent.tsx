import Image from "next/image";
import {
	getInitials,
	pickAvatarColor,
} from "@/presentation/components/map/FacilityAvatar/FacilityAvatarComponent.rules";
import { AVATAR_SIZES } from "@/presentation/components/map/FacilityAvatar/FacilityAvatarComponent.styles";
import type { FacilityAvatarProps } from "@/presentation/components/map/FacilityAvatar/FacilityAvatarComponent.types";

export function FacilityAvatar({ name, avatarUrl, size = "sm" }: Readonly<FacilityAvatarProps>) {
	const { pixels, className } = AVATAR_SIZES[size];
	if (avatarUrl) {
		return (
			<Image
				src={avatarUrl}
				alt=""
				width={pixels}
				height={pixels}
				unoptimized
				className={`${className} shrink-0 rounded-full object-cover`}
			/>
		);
	}
	return (
		<span
			aria-hidden
			data-size={size}
			className={`${className} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
			style={{ backgroundColor: pickAvatarColor(name) }}
		>
			{getInitials(name)}
		</span>
	);
}
