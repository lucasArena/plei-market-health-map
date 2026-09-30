import { createVitestConfig, DEFAULT_COVERAGE_EXCLUDE } from "@market-health-map/config/vitest";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const base = createVitestConfig({
	coverageExclude: [
		...DEFAULT_COVERAGE_EXCLUDE,
		"src/**/*.integration.test.ts",
		"src/container.ts",
		"src/infrastructure/repositories/database/prisma-client/prisma-client.ts",
		"src/infrastructure/repositories/database/prisma-login-event-repository/prisma-login-event-repository.ts",
		"src/infrastructure/repositories/warehouse/warehouse-pool/warehouse-pool.ts",
	],
});

export default defineConfig({
	...base,
	plugins: [tsconfigPaths()],
	test: { ...base.test, exclude: ["src/**/*.integration.test.ts", "node_modules/**"] },
});
