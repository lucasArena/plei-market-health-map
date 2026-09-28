import { recordLoginSchema } from "@application/dtos/login-event-dto";
import type { LoginEventView, RecordLoginInput } from "@application/dtos/login-event-dto.types";
import { toLoginEventView } from "@application/mappers/login-event-mapper";
import type { RecordLoginDeps } from "@application/use-cases/record-login.types";
import { LoginEvent } from "@market-health-map/domain";

export function makeRecordLogin({ loginEvents, ids, clock }: RecordLoginDeps) {
	return async function recordLogin(input: RecordLoginInput): Promise<LoginEventView> {
		const { userId, sessionId, email } = recordLoginSchema.parse(input);
		const existing = await loginEvents.findBySessionId(sessionId);
		if (existing) return toLoginEventView(existing);

		const event = LoginEvent.create({
			id: ids.generate(),
			userId,
			sessionId,
			email,
			signedInAt: clock.now(),
		});
		await loginEvents.save(event);
		return toLoginEventView(event);
	};
}
