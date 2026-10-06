import type {
	AppSessionFilterOptions,
	AppSessionFilters,
} from "@core/application/dtos/app-session-filters-dto.types";

export const PLAYER_DEMOGRAPHIC_FILTERS_FLAG = "player-demographic-filters";

export const EMPTY_APP_SESSION_FILTER_OPTIONS: AppSessionFilterOptions = {
	genders: [],
	skills: [],
	ages: [],
};

export function demographicFiltersEnabled(enabledFlags: readonly string[]): boolean {
	return enabledFlags.includes(PLAYER_DEMOGRAPHIC_FILTERS_FLAG);
}

export function appSessionFiltersForEnabledFlags(
	filters: AppSessionFilters,
	enabledFlags: readonly string[],
): AppSessionFilters {
	if (demographicFiltersEnabled(enabledFlags)) {
		return filters;
	}
	return {};
}
