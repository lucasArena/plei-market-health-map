import type {
	CreateLoginEventInput,
	LoginEventProps,
} from "@core/domain/entities/login-event/login-event.types";
import { guard } from "@core/domain/shared/guard";
import type { EntityId } from "@core/domain/shared/id.types";

const MAX_IDENTIFIER_LENGTH = 191;

export class LoginEvent {
	private constructor(private readonly props: LoginEventProps) {}

	static create(input: CreateLoginEventInput): LoginEvent {
		return new LoginEvent({
			id: input.id,
			userId: guard.maxLength(
				guard.notEmpty(input.userId, "User id"),
				MAX_IDENTIFIER_LENGTH,
				"User id",
			),
			sessionId: guard.maxLength(
				guard.notEmpty(input.sessionId, "Session id"),
				MAX_IDENTIFIER_LENGTH,
				"Session id",
			),
			email: guard.email(input.email, "Email"),
			signedInAt: input.signedInAt,
		});
	}

	static restore(props: LoginEventProps): LoginEvent {
		return new LoginEvent({ ...props });
	}

	get id(): EntityId {
		return this.props.id;
	}

	get userId(): string {
		return this.props.userId;
	}

	get sessionId(): string {
		return this.props.sessionId;
	}

	get signedInAt(): Date {
		return this.props.signedInAt;
	}

	toJSON(): LoginEventProps {
		return { ...this.props };
	}
}
