import { asEntityId, LoginEvent } from "@market-health-map/core/domain";
import type { LoginEventRow } from "@server/infrastructure/repositories/database/login-event-record/login-event-record.types";

export function toDomainLoginEvent(row: LoginEventRow): LoginEvent {
	return LoginEvent.restore({
		id: asEntityId(row.id),
		userId: row.userId,
		sessionId: row.sessionId,
		email: row.email,
		signedInAt: row.signedInAt,
	});
}

export function toLoginEventRecord(event: LoginEvent): LoginEventRow {
	const props = event.toJSON();
	return {
		id: props.id,
		userId: props.userId,
		sessionId: props.sessionId,
		email: props.email,
		signedInAt: props.signedInAt,
	};
}
