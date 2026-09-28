export interface MarkerImageTarget {
	hasImage(id: string): boolean;
	addImage(id: string, image: HTMLImageElement, options: { pixelRatio: number }): void;
}
