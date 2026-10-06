export interface AppSessionFilters {
	metric?: "registrations";
	gender?: string | string[];
	skill?: string | string[];
	ageMin?: number;
	ageMax?: number;
}

export interface AppSessionFilterOptions {
	ages: number[];
	genders: string[];
	skills: string[];
}
