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
	name: string | null;
	image: string | null;
	canViewAppMetrics: boolean;
}

export type InternalAccess = AnonymousAccess | DeniedAccess | AllowedAccess;
