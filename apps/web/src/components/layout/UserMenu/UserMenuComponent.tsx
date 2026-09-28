"use client";

import { useUserMenuRules } from "@/components/layout/UserMenu/UserMenuComponent.rules";
import type { UserMenuProps } from "@/components/layout/UserMenu/UserMenuComponent.types";
import { FacilityAvatar } from "@/components/map/FacilityAvatar/FacilityAvatarComponent";
import { signOutOfApp } from "@/server/auth/actions";

export function UserMenu({ name, email, image }: Readonly<UserMenuProps>) {
	const { containerRef, isOpen, messages, toggle, versionLabel } = useUserMenuRules();
	const displayName = name ?? email;

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={toggle}
				aria-label={messages.accountMenu}
				aria-expanded={isOpen}
				className="flex rounded-full ring-offset-2 transition-shadow hover:ring-2 hover:ring-border"
			>
				<FacilityAvatar name={displayName} avatarUrl={image} />
			</button>
			{isOpen && (
				<div
					role="menu"
					className="absolute top-full right-0 mt-2 w-64 rounded-xl border bg-background p-3 shadow-lg"
				>
					<p className="truncate text-sm font-medium">{displayName}</p>
					<p className="truncate text-xs text-muted-foreground">{email}</p>
					<form action={signOutOfApp} className="mt-3 flex items-center gap-2 border-t pt-3">
						<button
							type="submit"
							role="menuitem"
							className="flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
						>
							{messages.signOut}
						</button>
						<span className="shrink-0 pr-2 text-[11px] text-muted-foreground tabular-nums">
							{versionLabel}
						</span>
					</form>
				</div>
			)}
		</div>
	);
}
