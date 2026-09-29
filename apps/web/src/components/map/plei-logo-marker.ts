import type { MarkerImageTarget } from "@/components/map/plei-logo-marker.types";

export const PLEI_LOGO_IMAGE_ID = "plei-logo";
export const PLEI_LOGO_URL = "/images/plei-logo.svg";
export const PLEI_LOGO_MUTED_IMAGE_ID = "plei-logo-muted";
export const PLEI_LOGO_MUTED_URL = "/images/plei-logo-muted.svg";
export const PLEI_LOGO_PIXEL_RATIO = 2;
export const PLEI_LOGO_SIZE_PX = 40 * PLEI_LOGO_PIXEL_RATIO;

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
