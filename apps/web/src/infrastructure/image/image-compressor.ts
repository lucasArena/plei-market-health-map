import type {
	CompressionPass,
	DecodedImage,
	ImageCanvas,
	ImageCompressorOptions,
} from "@/infrastructure/image/image-compressor.types";

export const DEFAULT_COMPRESSION_PASSES: readonly CompressionPass[] = [
	{ maxDimension: 1600, quality: 0.8 },
];

const OUTPUT_TYPES = ["image/webp", "image/jpeg"] as const;

const EXTENSIONS: Readonly<Record<string, string>> = {
	"image/webp": "webp",
	"image/jpeg": "jpg",
};

export function totalBytes(files: readonly File[]): number {
	return files.reduce((sum, file) => sum + file.size, 0);
}

function renamed(name: string, type: string): string {
	return `${name.replace(/\.[^.]+$/, "") || "screenshot"}.${EXTENSIONS[type]}`;
}

function toBlob(canvas: ImageCanvas, type: string, quality: number): Promise<Blob | null> {
	return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export class ImageCompressor {
	private readonly decode: (file: File) => Promise<DecodedImage>;
	private readonly createCanvas: () => ImageCanvas;
	private readonly passes: readonly CompressionPass[];

	constructor(options: ImageCompressorOptions = {}) {
		this.decode = options.decode ?? ((file) => createImageBitmap(file));
		this.createCanvas =
			options.createCanvas ?? (() => document.createElement("canvas") as unknown as ImageCanvas);
		this.passes = options.passes ?? DEFAULT_COMPRESSION_PASSES;
	}

	async fitWithin(files: readonly File[], budgetBytes: number): Promise<File[]> {
		let current = [...files];
		for (const pass of this.passes) {
			if (totalBytes(current) <= budgetBytes) return current;
			current = await Promise.all(files.map((file) => this.compress(file, pass)));
		}
		return current;
	}

	async compress(file: File, pass: CompressionPass): Promise<File> {
		try {
			const image = await this.decode(file);
			const scale = Math.min(1, pass.maxDimension / Math.max(image.width, image.height));
			const canvas = this.createCanvas();
			canvas.width = Math.max(1, Math.round(image.width * scale));
			canvas.height = Math.max(1, Math.round(image.height * scale));
			canvas.getContext("2d")?.drawImage(image as never, 0, 0, canvas.width, canvas.height);
			image.close?.();
			for (const type of OUTPUT_TYPES) {
				const blob = await toBlob(canvas, type, pass.quality);
				if (blob?.type === type && blob.size < file.size) {
					return new File([blob], renamed(file.name, type), { type });
				}
			}
			return file;
		} catch {
			return file;
		}
	}
}

export const imageCompressor = new ImageCompressor();
