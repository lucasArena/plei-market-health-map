export interface CompressionPass {
	maxDimension: number;
	quality: number;
}

export interface DecodedImage {
	width: number;
	height: number;
	close?: () => void;
}

export interface ImageCanvas {
	width: number;
	height: number;
	getContext(
		kind: "2d",
	): { drawImage(image: never, x: number, y: number, w: number, h: number): void } | null;
	toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

export interface ImageCompressorOptions {
	decode?: (file: File) => Promise<DecodedImage>;
	createCanvas?: () => ImageCanvas;
	passes?: readonly CompressionPass[];
}
