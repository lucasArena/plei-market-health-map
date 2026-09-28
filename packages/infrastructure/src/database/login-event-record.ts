import type { LoginEventRow } from "@infra/database/login-event-record.types";
import { asEntityId, LoginEvent } from "@market-health-map/domain";

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
