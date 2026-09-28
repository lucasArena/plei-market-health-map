import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

export type ServiceWorkerSelf = SerwistGlobalConfig & {
	__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};
