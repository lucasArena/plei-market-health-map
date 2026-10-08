import type { Facility } from "@core/domain";

export interface FacilityRepository {
	/** Facilities with game counts for the windows ending the day before `today` (YYYY-MM-DD). */
	listAll(today: string): Promise<Facility[]>;
}
