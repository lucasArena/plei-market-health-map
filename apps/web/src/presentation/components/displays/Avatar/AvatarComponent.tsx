import Image from "next/image";
import {
	getInitials,
	pickAvatarColor,
	pickMutedAvatarColor,
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
		muted: appearanceClass,
	}[appearance];
	const imageBackgroundClass = appearance === "account" ? "" : "dark:bg-white";
	const imagePixels = { color: pixels, account: 32, muted: 20 }[appearance];
	const backgroundColor = {
		color: pickAvatarColor(name),
		account: undefined,
		muted: pickMutedAvatarColor(name),
	}[appearance];
	if (avatarUrl) {
		return (
			<Image
				src={avatarUrl}
				alt=""
				width={imagePixels}
				height={imagePixels}
				unoptimized
				className={`${sizedClass} ${imageBackgroundClass} shrink-0 rounded-full object-cover`}
			/>
		);
	}

	return (
		<span
			aria-hidden
			data-size={size}
			data-appearance={appearance}
			className={`${sizedClass} flex shrink-0 items-center justify-center rounded-full`}
			style={backgroundColor ? { backgroundColor } : undefined}
		>
			{getInitials(name)}
		</span>
	);
}
