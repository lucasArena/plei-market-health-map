import {
	loadPleiLogo,
	PLEI_LOGO_IMAGE_ID,
	PLEI_LOGO_SIZE_PX,
	PLEI_LOGO_URL,
} from "@/presentation/components/map/plei-logo-marker";

function target(hasImage: boolean | (() => boolean)) {
	return {
		hasImage: vi.fn(typeof hasImage === "function" ? hasImage : () => hasImage),
		addImage: vi.fn(),
	};
}

describe("loadPleiLogo", () => {
	const decode = vi.fn();

	beforeEach(() => {
		decode.mockReset().mockResolvedValue(undefined);
		Object.defineProperty(HTMLImageElement.prototype, "decode", {
			configurable: true,
			value: decode,
		});
	});

	it("adds the Plei logo as a high-density map image", async () => {
		const map = target(false);

		await loadPleiLogo(map);

		const [id, image, options] = map.addImage.mock.calls[0] ?? [];
		expect(id).toBe(PLEI_LOGO_IMAGE_ID);
		expect(image).toBeInstanceOf(HTMLImageElement);
		expect((image as HTMLImageElement).src).toContain(PLEI_LOGO_URL);
		expect((image as HTMLImageElement).width).toBe(PLEI_LOGO_SIZE_PX);
		expect(options).toEqual({ pixelRatio: 2 });
	});

	it("skips loading when the image already exists", async () => {
		const map = target(true);
		await loadPleiLogo(map);
		expect(map.addImage).not.toHaveBeenCalled();
	});

	it("does not add twice if another load finished first", async () => {
		let calls = 0;
		const map = target(() => calls++ > 0);
		await loadPleiLogo(map);
		expect(map.addImage).not.toHaveBeenCalled();
	});

	it("rejects when the image cannot be decoded", async () => {
		decode.mockRejectedValue(new Error("bad image"));
		await expect(loadPleiLogo(target(false))).rejects.toThrow("bad image");
	});
});
