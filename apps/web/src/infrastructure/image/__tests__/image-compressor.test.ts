import { ImageCompressor, imageCompressor } from "@/infrastructure/image/image-compressor";
import type { ImageCanvas } from "@/infrastructure/image/image-compressor.types";

function file(name: string, size: number, type = "image/png") {
	return new File([new Uint8Array(size)], name, { type });
}

function fakeCanvas(output: (type?: string, quality?: number) => Blob | null) {
	const drawImage = vi.fn();
	const canvas: ImageCanvas & { drawImage: typeof drawImage } = {
		width: 0,
		height: 0,
		drawImage,
		getContext: () => ({ drawImage }),
		toBlob: (callback, type, quality) => callback(output(type, quality)),
	};
	return canvas;
}

describe("ImageCompressor", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("keeps the originals when they already fit the budget", async () => {
		const decode = vi.fn();
		const compressor = new ImageCompressor({ decode });
		const files = [file("a.png", 10)];

		await expect(compressor.fitWithin(files, 100)).resolves.toEqual(files);
		expect(decode).not.toHaveBeenCalled();
	});

	it("downscales to the largest side and encodes as WebP until the total fits", async () => {
		const close = vi.fn();
		const canvases: ReturnType<typeof fakeCanvas>[] = [];
		const compressor = new ImageCompressor({
			decode: async () => ({ width: 3200, height: 1600, close }),
			createCanvas: () => {
				const canvas = fakeCanvas(
					(type, quality) => new Blob([new Uint8Array(quality === 0.5 ? 20 : 80)], { type }),
				);
				canvases.push(canvas);
				return canvas;
			},
			passes: [
				{ maxDimension: 1600, quality: 0.8 },
				{ maxDimension: 800, quality: 0.5 },
			],
		});

		const [result] = await compressor.fitWithin([file("shot.final.png", 100)], 50);

		expect(result?.name).toBe("shot.final.webp");
		expect(result?.type).toBe("image/webp");
		expect(result?.size).toBe(20);
		expect(canvases.map((canvas) => [canvas.width, canvas.height])).toEqual([
			[1600, 800],
			[800, 400],
		]);
		expect(close).toHaveBeenCalledTimes(2);
	});

	it("falls back to JPEG when the browser can't encode WebP", async () => {
		const compressor = new ImageCompressor({
			decode: async () => ({ width: 10, height: 10 }),
			createCanvas: () =>
				fakeCanvas((type) =>
					type === "image/jpeg"
						? new Blob([new Uint8Array(5)], { type })
						: new Blob([], { type: "image/png" }),
				),
		});

		const result = await compressor.compress(file(".png", 50), { maxDimension: 100, quality: 0.8 });

		expect(result.name).toBe("screenshot.jpg");
		expect(result.type).toBe("image/jpeg");
	});

	it("keeps the original when encoding makes it bigger, fails or can't decode", async () => {
		const original = file("tiny.png", 4);
		const bigger = new ImageCompressor({
			decode: async () => ({ width: 1, height: 1 }),
			createCanvas: () => fakeCanvas((type) => new Blob([new Uint8Array(40)], { type })),
		});
		const empty = new ImageCompressor({
			decode: async () => ({ width: 1, height: 1 }),
			createCanvas: () => ({ ...fakeCanvas(() => null), getContext: () => null }),
		});
		const broken = new ImageCompressor({ decode: () => Promise.reject(new Error("bad")) });
		const pass = { maxDimension: 10, quality: 0.8 };

		await expect(bigger.compress(original, pass)).resolves.toBe(original);
		await expect(empty.compress(original, pass)).resolves.toBe(original);
		await expect(broken.compress(original, pass)).resolves.toBe(original);
	});

	it("uses the browser's bitmap decoder and canvas by default", async () => {
		const canvas = fakeCanvas((type) => new Blob([new Uint8Array(1)], { type }));
		vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 2, height: 2 }));
		const createElement = vi
			.spyOn(document, "createElement")
			.mockReturnValue(canvas as unknown as HTMLElement);

		const [result] = await imageCompressor.fitWithin(
			[file("a.png", 5 * 1000 * 1000)],
			4 * 1000 * 1000,
		);

		expect(createElement).toHaveBeenCalledWith("canvas");
		expect(result?.type).toBe("image/webp");
		createElement.mockRestore();
	});
});
