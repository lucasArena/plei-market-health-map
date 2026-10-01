export const AVATAR_SIZES = {
	sm: { pixels: 36, className: "size-9 text-sm" },
	lg: { pixels: 80, className: "size-20 text-2xl" },
} as const;

export const AVATAR_APPEARANCE_CLASS = {
	color: "font-semibold text-white",
	account: "size-[32px] bg-[#d1d5db] text-[11px] font-semibold text-[#111827]",
	muted:
		"size-5 border-0 text-[10px] font-normal leading-4 text-foreground shadow-none ring-0 outline-none",
} as const;
