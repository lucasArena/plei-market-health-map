import type { LoginEventView } from "@application/dtos/login-event-dto.types";
import type { LoginEvent } from "@market-health-map/domain";

export function toLoginEventView(event: LoginEvent): LoginEventView {
	const props = event.toJSON();
	return {
		id: props.id,
		userId: props.userId,
		email: props.email,
		signedInAt: props.signedInAt.toISOString(),
	};
}
