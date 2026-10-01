export interface AppSessionFilters {
	gender?: string;
	skill?: string;
	ageMin?: number;
	ageMax?: number;
}

export interface AppSessionFilterOptions {
	genders: string[];
	skills: string[];
}
