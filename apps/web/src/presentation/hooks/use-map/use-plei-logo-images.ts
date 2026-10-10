"use client";

import { useEffect, useState } from "react";
import {
	PLEI_LOGO_IMAGE_ID,
	PLEI_LOGO_MUTED_IMAGE_ID,
	PLEI_LOGO_MUTED_URL,
	PLEI_LOGO_PIXEL_RATIO,
	PLEI_LOGO_SIZE_PX,
	PLEI_LOGO_URL,
} from "@/application/constants/plei-logo";
import type { MarkerImageTarget } from "@/presentation/hooks/use-map/use-plei-logo-images.types";

async function loadMarkerImage(target: MarkerImageTarget, id: string, url: string): Promise<void> {
	if (target.hasImage(id)) return;
	const image = new Image(PLEI_LOGO_SIZE_PX, PLEI_LOGO_SIZE_PX);
	image.src = url;
	await image.decode();
	if (target.hasImage(id)) return;
	target.addImage(id, image, { pixelRatio: PLEI_LOGO_PIXEL_RATIO });
}

export async function loadPleiLogos(target: MarkerImageTarget): Promise<void> {
	await Promise.all([
		loadMarkerImage(target, PLEI_LOGO_IMAGE_ID, PLEI_LOGO_URL),
		loadMarkerImage(target, PLEI_LOGO_MUTED_IMAGE_ID, PLEI_LOGO_MUTED_URL),
	]);
}

export function usePleiLogoImages(target: MarkerImageTarget | null, revision = 0): boolean {
	const [loadedRevision, setLoadedRevision] = useState(-1);
	const [loadedTarget, setLoadedTarget] = useState<MarkerImageTarget | null>(null);

	useEffect(() => {
		if (!target) return;
		let isCancelled = false;
		loadPleiLogos(target)
			.then(() => {
				if (!isCancelled) {
					setLoadedTarget(target);
					setLoadedRevision(revision);
				}
			})
			.catch(() => undefined);
		return () => {
			isCancelled = true;
		};
	}, [target, revision]);

	return target !== null && loadedTarget === target && loadedRevision === revision;
}
