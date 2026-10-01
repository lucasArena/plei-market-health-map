import Image from "next/image";
import {
	getInitials,
	pickAvatarColor,
} from "@/presentation/components/displays/Avatar/AvatarComponent.rules";
import {
	AVATAR_APPEARANCE_CLASS,
	AVATAR_SIZES,
} from "@/presentation/components/displays/Avatar/AvatarComponent.styles";
import type { AvatarProps } from "@/presentation/components/displays/Avatar/AvatarComponent.types";

export function Avatar({
	name,
	avatarUrl,
	size = "sm",
	appearance = "color",
}: Readonly<AvatarProps>) {
	const { pixels, className } = AVATAR_SIZES[size];
	const appearanceClass = AVATAR_APPEARANCE_CLASS[appearance];
	const sizedClass = {
		color: `${className} ${appearanceClass}`,
		account: appearanceClass,
	}[appearance];
	const imagePixels = { color: pixels, account: 32 }[appearance];
	if (avatarUrl) {
		return (
			<Image
				src={avatarUrl}
				alt=""
				width={imagePixels}
				height={imagePixels}
				unoptimized
				className={`${sizedClass} shrink-0 rounded-full object-cover`}
			/>
		);
	}

	return (
		<span
			aria-hidden
			data-size={size}
			data-appearance={appearance}
			className={`${sizedClass} flex shrink-0 items-center justify-center rounded-full`}
			style={appearance === "color" ? { backgroundColor: pickAvatarColor(name) } : undefined}
		>
			{getInitials(name)}
		</span>
	);
}
