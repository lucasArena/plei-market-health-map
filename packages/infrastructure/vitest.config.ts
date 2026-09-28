import { createVitestConfig, DEFAULT_COVERAGE_EXCLUDE } from "@market-health-map/config/vitest";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const base = createVitestConfig({
	coverageExclude: [
		...DEFAULT_COVERAGE_EXCLUDE,
		"src/**/*.integration.test.ts",
		"src/database/prisma-client.ts",
		"src/database/prisma-login-event-repository.ts",
		"src/warehouse/warehouse-pool.ts",
	],
});

export default defineConfig({
	...base,
	plugins: [tsconfigPaths()],
	test: { ...base.test, exclude: ["src/**/*.integration.test.ts", "node_modules/**"] },
});
