import type { ViteUserConfig } from "vitest/config";
import type { CoverageThreshold, CreateVitestConfigOptions } from "./base.types";

export const DEFAULT_THRESHOLD: CoverageThreshold = {
	lines: 95,
	functions: 95,
	branches: 95,
	statements: 95,
};

export const DEFAULT_COVERAGE_EXCLUDE = [
	"src/**/*.test.{ts,tsx}",
	"src/**/__tests__/**",
	"src/**/index.ts",
	"src/**/*.types.ts",
	"src/**/*.d.ts",
	"src/**/testing/**",
	"src/**/generated/**",
];

export function createVitestConfig(options: CreateVitestConfigOptions = {}): ViteUserConfig {
	const {
		environment = "node",
		setupFiles = [],
		coverageInclude = ["src/**/*.{ts,tsx}"],
		coverageExclude = DEFAULT_COVERAGE_EXCLUDE,
		threshold = {},
	} = options;

	return {
		test: {
			globals: true,
			environment,
			setupFiles,
			include: ["src/**/*.test.{ts,tsx}"],
			passWithNoTests: false,
			coverage: {
				provider: "v8",
				reporter: ["text", "html", "lcov"],
				include: coverageInclude,
				exclude: coverageExclude,
				thresholds: { ...DEFAULT_THRESHOLD, ...threshold },
			},
		},
	};
}
