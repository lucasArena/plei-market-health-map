import type { ReactNode } from "react";
import type {
	ModuleIconName,
	ModuleIconProps,
} from "@/presentation/components/displays/ModuleIcon/ModuleIconComponent.types";

/**
 * Inline lucide icons (the app draws its icons as inline lucide SVGs; it has no
 * icon package): users = users, markets = map-pin, facilities = building-2.
 * Lucide has no soccer ball and the app has no soccer-ball asset, so games is a
 * small custom soccer ball (circle, center pentagon, five seams) in the same
 * 24px grid, 2px round stroke.
 */
const ICON_PATHS: Record<ModuleIconName, ReactNode> = {
	games: (
		<>
			<circle cx="12" cy="12" r="10" />
			<path d="m12 8.5 3.33 2.42-1.27 3.91H9.94l-1.27-3.91Z" />
			<path d="M12 8.5V2" />
			<path d="m15.33 10.92 6.18-2.01" />
			<path d="m14.06 14.83 3.82 5.26" />
			<path d="m9.94 14.83-3.82 5.26" />
			<path d="M8.67 10.92 2.49 8.91" />
		</>
	),
	users: (
		<>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</>
	),
	markets: (
		<>
			<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
			<circle cx="12" cy="10" r="3" />
		</>
	),
	facilities: (
		<>
			<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
			<path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
			<path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
			<path d="M10 6h4" />
			<path d="M10 10h4" />
			<path d="M10 14h4" />
			<path d="M10 18h4" />
		</>
	),
};

/** 14px module title icon in the secondary text color; decorative only. */
export function ModuleIcon({ name }: Readonly<ModuleIconProps>) {
	return (
		<svg
			aria-hidden="true"
			data-testid={`module-icon-${name}`}
			data-icon={name}
			width={14}
			height={14}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-[14px] shrink-0 text-[#525866]"
		>
			{ICON_PATHS[name]}
		</svg>
	);
}
