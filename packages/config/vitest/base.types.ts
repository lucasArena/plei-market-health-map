export interface CoverageThreshold {
	lines: number;
	functions: number;
	branches: number;
	statements: number;
}

export interface CreateVitestConfigOptions {
	environment?: "node" | "jsdom";
	setupFiles?: string[];
	coverageInclude?: string[];
	coverageExclude?: string[];
	threshold?: Partial<CoverageThreshold>;
}
