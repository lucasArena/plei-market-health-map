import type { MarkerImageTarget } from "@/presentation/components/map/plei-logo-marker.types";

export const PLEI_LOGO_IMAGE_ID = "plei-logo";
export const PLEI_LOGO_URL = "/images/plei-logo.svg";
export const PLEI_LOGO_PIXEL_RATIO = 2;
export const PLEI_LOGO_SIZE_PX = 40 * PLEI_LOGO_PIXEL_RATIO;

export async function loadPleiLogo(target: MarkerImageTarget): Promise<void> {
	if (target.hasImage(PLEI_LOGO_IMAGE_ID)) return;
	const image = new Image(PLEI_LOGO_SIZE_PX, PLEI_LOGO_SIZE_PX);
	image.src = PLEI_LOGO_URL;
	await image.decode();
	if (target.hasImage(PLEI_LOGO_IMAGE_ID)) return;
	target.addImage(PLEI_LOGO_IMAGE_ID, image, { pixelRatio: PLEI_LOGO_PIXEL_RATIO });
}
