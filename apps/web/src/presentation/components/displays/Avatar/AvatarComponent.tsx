import Image from "next/image";
import {
	getInitials,
	pickAvatarColor,
} from "@/presentation/components/displays/Avatar/AvatarComponent.rules";
import { AVATAR_SIZES } from "@/presentation/components/displays/Avatar/AvatarComponent.styles";
import type { AvatarProps } from "@/presentation/components/displays/Avatar/AvatarComponent.types";

export function Avatar({ name, avatarUrl, size = "sm" }: Readonly<AvatarProps>) {
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
