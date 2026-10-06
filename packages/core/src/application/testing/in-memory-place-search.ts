import type { PlaceView } from "@core/application/dtos/place-dto.types";
import type { PlaceSearch } from "@core/application/providers/place-search.types";

export class InMemoryPlaceSearch implements PlaceSearch {
	readonly searched: string[] = [];

	constructor(private readonly places: PlaceView[]) {}

	async search(query: string, limit: number): Promise<PlaceView[]> {
		this.searched.push(query);
		return this.places
			.filter((place) => place.name.toLocaleLowerCase().includes(query))
			.slice(0, limit);
	}
}
