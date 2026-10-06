import { PLACE_RESULT_LIMIT, searchPlacesSchema } from "@core/application/dtos/place-dto";
import type { PlaceView, SearchPlacesInput } from "@core/application/dtos/place-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import type { SearchPlacesDeps } from "@core/application/services/search-places.types";

export function makeSearchPlaces({ places }: SearchPlacesDeps) {
	return async function searchPlaces(input: SearchPlacesInput): Promise<PlaceView[]> {
		const parsed = searchPlacesSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		return places.search(parsed.data.query.toLocaleLowerCase(), PLACE_RESULT_LIMIT);
	};
}
