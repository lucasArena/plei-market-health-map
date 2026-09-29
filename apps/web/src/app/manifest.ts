import { DEFAULT_LOCALE, getMessages } from "@market-health-map/core/i18n";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	const { common } = getMessages(DEFAULT_LOCALE);
	return {
		name: common.appName,
		short_name: common.appName,
		description: common.appDescription,
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#047857",
		icons: [
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
