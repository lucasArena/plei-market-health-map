"use client";

import { FacilityAvatar } from "@/components/map/FacilityAvatar/FacilityAvatarComponent";
import { useFacilityPanelRules } from "@/components/map/FacilityPanel/FacilityPanelComponent.rules";
import type { FacilityPanelProps } from "@/components/map/FacilityPanel/FacilityPanelComponent.types";

export function FacilityPanel(props: Readonly<FacilityPanelProps>) {
	const { facility, messages, onClose } = useFacilityPanelRules(props);

	return (
		<aside
			aria-label={messages.details}
			className="absolute top-0 right-0 bottom-0 z-20 flex w-[min(360px,100%)] flex-col border-l bg-background shadow-2xl"
		>
			<button
				type="button"
				onClick={onClose}
				aria-label={messages.close}
				className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				×
			</button>
			<div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
				<FacilityAvatar name={facility.name} avatarUrl={facility.avatarUrl} size="lg" />
				<h2 className="text-lg font-semibold">{facility.name}</h2>
			</div>
		</aside>
	);
}
