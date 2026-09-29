import { createVitestConfig, DEFAULT_COVERAGE_EXCLUDE } from "@market-health-map/config/vitest";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	...createVitestConfig({
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		coverageInclude: ["src/**/*.{ts,tsx}"],
		coverageExclude: [
			...DEFAULT_COVERAGE_EXCLUDE,
			"src/app/sw.ts",
			"src/app/**/layout.tsx",
			"src/proxy.ts",
			"src/application/test/**",
		],
	}),
	plugins: [tsconfigPaths(), react()],
});
