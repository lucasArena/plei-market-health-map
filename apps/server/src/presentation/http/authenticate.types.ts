export interface AuthenticatedPrincipal {
	userId: string;
	email: string;
	name?: string | null;
}

export interface AnonymousAccess {
	status: "anonymous";
}

export interface DeniedAccess {
	status: "denied";
	email: string;
}

export interface AllowedAccess {
	status: "allowed";
	userId: string;
	email: string;
	name?: string | null;
}

export type AccessDecision = AnonymousAccess | DeniedAccess | AllowedAccess;

export type ResolveAccess = (request: Request) => Promise<AccessDecision>;
