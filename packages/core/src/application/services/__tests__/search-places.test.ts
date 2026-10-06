import { PLACE_RESULT_LIMIT } from "@core/application/dtos/place-dto";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { makeSearchPlaces } from "@core/application/services/search-places";
import { InMemoryPlaceSearch } from "@core/application/testing/in-memory-place-search";

function place(id: string, name: string) {
	return {
		id,
		name,
		kind: "city" as const,
		context: "Kansas, United States",
		location: { latitude: 37.69, longitude: -97.34 },
		bounds: null,
	};
}

describe("searchPlaces", () => {
	it("searches the trimmed, lowercased query and caps the results", async () => {
		const places = new InMemoryPlaceSearch(
			Array.from({ length: 8 }, (_, index) => place(`p${index}`, `Wichita ${index}`)),
		);

		const results = await makeSearchPlaces({ places })({ query: "  Wichita " });

		expect(places.searched).toEqual(["wichita"]);
		expect(results).toHaveLength(PLACE_RESULT_LIMIT);
	});

	it("rejects queries that are too short or too long", async () => {
		const searchPlaces = makeSearchPlaces({ places: new InMemoryPlaceSearch([]) });

		await expect(searchPlaces({ query: " w " })).rejects.toBeInstanceOf(InvalidRequestError);
		await expect(searchPlaces({ query: "x".repeat(101) })).rejects.toBeInstanceOf(
			InvalidRequestError,
		);
	});
});
