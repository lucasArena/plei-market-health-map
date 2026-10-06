import {
	appSessionFiltersForEnabledFlags,
	demographicFiltersEnabled,
	EMPTY_APP_SESSION_FILTER_OPTIONS,
	PLAYER_DEMOGRAPHIC_FILTERS_FLAG,
} from "@core/application/dtos/app-session-filters-policy";

it("treats demographic filters as enabled only with the feature flag", () => {
	expect(demographicFiltersEnabled([])).toBe(false);
	expect(demographicFiltersEnabled([PLAYER_DEMOGRAPHIC_FILTERS_FLAG])).toBe(true);
});

it("strips demographic cohort fields when the flag is off", () => {
	const cohort = {
		metric: "registrations" as const,
		gender: "Female",
		skill: "Advanced",
		ageMin: 25,
		ageMax: 34,
	};
	expect(appSessionFiltersForEnabledFlags(cohort, [PLAYER_DEMOGRAPHIC_FILTERS_FLAG])).toEqual(
		cohort,
	);
	expect(appSessionFiltersForEnabledFlags(cohort, [])).toEqual({});
});

it("exposes an empty filter-options shape for disabled demographics", () => {
	expect(EMPTY_APP_SESSION_FILTER_OPTIONS).toEqual({ genders: [], skills: [], ages: [] });
});
