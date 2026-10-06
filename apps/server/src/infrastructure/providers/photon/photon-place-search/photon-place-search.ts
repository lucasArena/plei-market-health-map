import type { PlaceKind, PlaceSearch, PlaceView } from "@market-health-map/core/application";
import type {
	PhotonFeature,
	PhotonPlaceSearchOptions,
} from "@server/infrastructure/providers/photon/photon-place-search/photon-place-search.types";
import { z } from "zod";

export const PHOTON_SEARCH_URL = "https://photon.komoot.io/api/";
export const PHOTON_USER_AGENT =
	"plei-market-health-map/1.0 (+https://plei-market-health-map.vercel.app)";
export const PHOTON_PLACE_LAYERS = ["city", "locality", "district", "county", "state", "country"];

export const photonFeatureSchema = z.object({
	geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
	properties: z.object({
		osm_id: z.number(),
		osm_type: z.string(),
		name: z.string().optional(),
		type: z.string().optional(),
		state: z.string().optional(),
		country: z.string().optional(),
		extent: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
	}),
});

const photonResponseSchema = z.object({ features: z.array(photonFeatureSchema) });

const LABELED_KINDS: ReadonlySet<string> = new Set(["county", "state", "country"]);

function placeKind(type: string | undefined): PlaceKind {
	return type && LABELED_KINDS.has(type) ? (type as PlaceKind) : "city";
}

export function toPlaceView({ geometry, properties }: PhotonFeature): PlaceView | null {
	if (!properties.name) return null;
	const [longitude, latitude] = geometry.coordinates;
	const context = [...new Set([properties.state, properties.country])]
		.filter((part) => part && part !== properties.name)
		.join(", ");
	const extent = properties.extent;
	return {
		id: `${properties.osm_type}${properties.osm_id}`,
		name: properties.name,
		kind: placeKind(properties.type),
		context,
		location: { latitude, longitude },
		bounds: extent ? [extent[0], extent[3], extent[2], extent[1]] : null,
	};
}

export class PhotonPlaceSearch implements PlaceSearch {
	constructor(private readonly options: PhotonPlaceSearchOptions = {}) {}

	async search(query: string, limit: number): Promise<PlaceView[]> {
		const url = new URL(PHOTON_SEARCH_URL);
		url.searchParams.set("q", query);
		url.searchParams.set("limit", String(limit));
		url.searchParams.set("lang", "en");
		for (const layer of PHOTON_PLACE_LAYERS) url.searchParams.append("layer", layer);
		const send = this.options.fetch ?? fetch;
		const response = await send(url, {
			headers: { Accept: "application/json", "User-Agent": PHOTON_USER_AGENT },
		});
		if (!response.ok) throw new Error(`Photon responded with ${response.status}.`);
		const { features } = photonResponseSchema.parse(await response.json());
		return features.flatMap((feature) => {
			const place = toPlaceView(feature);
			return place ? [place] : [];
		});
	}
}
