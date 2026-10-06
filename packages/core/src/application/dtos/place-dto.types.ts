import type { searchPlacesSchema } from "@core/application/dtos/place-dto";
import type { GeoPoint } from "@core/domain";
import type { z } from "zod";

export type SearchPlacesInput = z.input<typeof searchPlacesSchema>;

export type PlaceBounds = [west: number, south: number, east: number, north: number];

export type PlaceKind = "city" | "county" | "state" | "country";

export interface PlaceView {
	id: string;
	name: string;
	kind: PlaceKind;
	context: string;
	location: GeoPoint;
	bounds: PlaceBounds | null;
}
