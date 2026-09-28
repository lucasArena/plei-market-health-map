import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

loadEnv({ path: "../../.env", quiet: true });

const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	disable: process.env.NODE_ENV === "development",
	additionalPrecacheEntries: [{ url: "/~offline", revision: randomUUID() }],
});

const nextConfig: NextConfig = {
	transpilePackages: [
		"@market-health-map/domain",
		"@market-health-map/application",
		"@market-health-map/infrastructure",
		"@market-health-map/i18n",
	],
	typedRoutes: true,
	devIndicators: false,
	serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "@neondatabase/serverless"],
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
