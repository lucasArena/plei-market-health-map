export const UNKNOWN_VERSION = "dev";

export function getAppVersion(): string {
	return process.env.NEXT_PUBLIC_APP_VERSION || UNKNOWN_VERSION;
}
