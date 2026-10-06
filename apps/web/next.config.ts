import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import withSerwistInit from "@serwist/next";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

loadEnv({ path: "../../.env", quiet: true });

const appVersion: string = JSON.parse(readFileSync("../../package.json", "utf8")).version;

const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	disable: process.env.NODE_ENV === "development",
	additionalPrecacheEntries: [{ url: "/~offline", revision: randomUUID() }],
});

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_APP_VERSION: appVersion,
	},
	transpilePackages: ["@market-health-map/core", "@market-health-map/server"],
	typedRoutes: true,
	devIndicators: false,
	serverExternalPackages: [
		"@prisma/client",
		"@prisma/adapter-neon",
		"@neondatabase/serverless",
		"pg",
	],
	async redirects() {
		return [
			{ source: "/metrics", destination: "/admin/metrics", permanent: true },
			{ source: "/feature-flags", destination: "/admin/feature-flags", permanent: true },
		];
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},
};

export default withSerwist(nextConfig);
