import { config as loadEnv } from "dotenv";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

loadEnv({ path: "../../.env", quiet: true });

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.integration.test.ts"],
	},
});
