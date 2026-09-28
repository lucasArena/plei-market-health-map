import Image from "next/image";
import {
	getInitials,
	pickAvatarColor,
} from "@/components/markets/FacilityAvatar/FacilityAvatarComponent.rules";
import type { FacilityAvatarProps } from "@/components/markets/FacilityAvatar/FacilityAvatarComponent.types";

export function FacilityAvatar({ name, avatarUrl }: Readonly<FacilityAvatarProps>) {
	if (avatarUrl) {
		return (
			<Image
				src={avatarUrl}
				alt=""
				width={40}
				height={40}
				unoptimized
				className="size-10 shrink-0 rounded-full object-cover"
			/>
		);
	}
	return (
		<span
			aria-hidden
			className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
			style={{ backgroundColor: pickAvatarColor(name) }}
		>
			{getInitials(name)}
		</span>
	);
}
