import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { ServiceWorkerSelf } from "@/app/sw.types";

declare const self: ServiceWorkerSelf;

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: defaultCache,
	fallbacks: {
		entries: [
			{
				url: "/~offline",
				matcher: ({ request }) => request.destination === "document",
			},
		],
	},
});

serwist.addEventListeners();
