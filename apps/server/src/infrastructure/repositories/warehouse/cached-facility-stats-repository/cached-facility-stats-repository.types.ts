export interface CachedFacilityStatsValue<Value> {
	expiresAt: number;
	value: Promise<Value>;
}
