import type { PlaceView } from "@core/application/dtos/place-dto.types";

export interface PlaceSearch {
	search(query: string, limit: number): Promise<PlaceView[]>;
}
