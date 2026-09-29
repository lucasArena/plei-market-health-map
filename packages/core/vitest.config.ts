import { createVitestConfig } from "@market-health-map/config/vitest";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({ ...createVitestConfig(), plugins: [tsconfigPaths()] });
