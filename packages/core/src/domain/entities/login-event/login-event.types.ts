import type { EntityId } from "@core/domain/shared/id.types";

export interface LoginEventProps {
	id: EntityId;
	userId: string;
	sessionId: string;
	email: string;
	signedInAt: Date;
}

export type CreateLoginEventInput = LoginEventProps;
