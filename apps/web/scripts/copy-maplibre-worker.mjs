import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve("maplibre-gl/package.json"));
const targetDir = join(import.meta.dirname, "..", "public", "maplibre");
const WORKER_FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

mkdirSync(targetDir, { recursive: true });
for (const file of WORKER_FILES) {
	copyFileSync(join(distDir, "dist", file), join(targetDir, file));
}
