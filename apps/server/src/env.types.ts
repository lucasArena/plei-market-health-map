export type FeedbackMode = "dry-run" | "linear-app" | "linear-api-key" | "unconfigured";

export interface LinearAppCredentials {
	kind: "app";
	clientId: string;
	clientSecret: string;
}

export interface LinearApiKeyCredentials {
	kind: "api-key";
	apiKey: string;
}

export type LinearCredentials = LinearAppCredentials | LinearApiKeyCredentials;
