import { act, renderHook, waitFor } from "@testing-library/react";
import {
	PLEI_LOGO_IMAGE_ID,
	PLEI_LOGO_MUTED_IMAGE_ID,
	PLEI_LOGO_MUTED_URL,
	PLEI_LOGO_SIZE_PX,
	PLEI_LOGO_URL,
} from "@/application/constants/plei-logo";
import {
	loadPleiLogos,
	usePleiLogoImages,
} from "@/presentation/hooks/use-map/use-plei-logo-images";

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

describe("usePleiLogoImages", () => {
	const decode = vi.fn();

	beforeEach(() => {
		decode.mockReset().mockResolvedValue(undefined);
		Object.defineProperty(HTMLImageElement.prototype, "decode", {
			configurable: true,
			value: decode,
		});
	});

	it("waits for a map", () => {
		const { result } = renderHook(() => usePleiLogoImages(null));

		expect(result.current).toBe(false);
	});

	it("reports the logos as ready once they are on the map", async () => {
		const map = target(false);
		const { result } = renderHook(() => usePleiLogoImages(map));

		expect(result.current).toBe(false);
		await waitFor(() => expect(result.current).toBe(true));
		expect(map.addImage).toHaveBeenCalledTimes(2);
	});

	it("stays not ready when the logos fail to load", async () => {
		decode.mockRejectedValue(new Error("bad image"));
		const { result } = renderHook(() => usePleiLogoImages(target(false)));

		await act(async () => undefined);
		expect(result.current).toBe(false);
	});

	it("ignores a load that finishes after the map is gone", async () => {
		let finish: () => void = () => undefined;
		decode.mockReturnValue(
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
		);
		const map = target(false);
		const { result, rerender } = renderHook(({ current }) => usePleiLogoImages(current), {
			initialProps: { current: map as ReturnType<typeof target> | null },
		});

		rerender({ current: null });
		await act(async () => finish());

		expect(result.current).toBe(false);
	});
});

describe("logo style restoration", () => {
	it("reloads both images for a new style on the same map", async () => {
		Object.defineProperty(HTMLImageElement.prototype, "decode", {
			configurable: true,
			value: vi.fn().mockResolvedValue(undefined),
		});
		const map = target(false);
		const { result, rerender } = renderHook(({ revision }) => usePleiLogoImages(map, revision), {
			initialProps: { revision: 1 },
		});
		await waitFor(() => expect(result.current).toBe(true));
		rerender({ revision: 2 });
		expect(result.current).toBe(false);
		await waitFor(() => expect(result.current).toBe(true));
		expect(map.addImage).toHaveBeenCalledTimes(4);
	});
});
