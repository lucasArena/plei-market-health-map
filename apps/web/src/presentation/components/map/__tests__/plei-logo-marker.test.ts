import {
	loadPleiLogos,
	PLEI_LOGO_IMAGE_ID,
	PLEI_LOGO_MUTED_IMAGE_ID,
	PLEI_LOGO_MUTED_URL,
	PLEI_LOGO_SIZE_PX,
	PLEI_LOGO_URL,
} from "@/presentation/components/map/plei-logo-marker";

function target(hasImage: boolean | (() => boolean)) {
	return {
		hasImage: vi.fn(typeof hasImage === "function" ? hasImage : () => hasImage),
		addImage: vi.fn(),
	};
}

describe("loadPleiLogos", () => {
	const decode = vi.fn();

	beforeEach(() => {
		decode.mockReset().mockResolvedValue(undefined);
		Object.defineProperty(HTMLImageElement.prototype, "decode", {
			configurable: true,
			value: decode,
		});
	});

	it("adds active and muted Plei logos as high-density map images", async () => {
		const map = target(false);

		await loadPleiLogos(map);

		expect(map.addImage).toHaveBeenCalledTimes(2);
		for (const [id, url] of [
			[PLEI_LOGO_IMAGE_ID, PLEI_LOGO_URL],
			[PLEI_LOGO_MUTED_IMAGE_ID, PLEI_LOGO_MUTED_URL],
		]) {
			const call = map.addImage.mock.calls.find(([imageId]) => imageId === id);
			const [, image, options] = call ?? [];
			expect(image).toBeInstanceOf(HTMLImageElement);
			expect((image as HTMLImageElement).src).toContain(url);
			expect((image as HTMLImageElement).width).toBe(PLEI_LOGO_SIZE_PX);
			expect(options).toEqual({ pixelRatio: 2 });
		}
	});

	it("skips loading when the image already exists", async () => {
		const map = target(true);
		await loadPleiLogos(map);
		expect(map.addImage).not.toHaveBeenCalled();
	});

	it("does not add twice if another load finished first", async () => {
		let calls = 0;
		const map = target(() => calls++ > 1);
		await loadPleiLogos(map);
		expect(map.addImage).not.toHaveBeenCalled();
	});

	it("rejects when the image cannot be decoded", async () => {
		decode.mockRejectedValue(new Error("bad image"));
		await expect(loadPleiLogos(target(false))).rejects.toThrow("bad image");
	});
});
