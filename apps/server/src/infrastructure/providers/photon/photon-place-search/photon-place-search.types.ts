import type { photonFeatureSchema } from "@server/infrastructure/providers/photon/photon-place-search/photon-place-search";
import type { z } from "zod";

export interface PhotonPlaceSearchOptions {
	fetch?: typeof fetch;
}

export type PhotonFeature = z.infer<typeof photonFeatureSchema>;
