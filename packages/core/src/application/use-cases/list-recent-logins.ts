import { listRecentLoginsSchema } from "@core/application/dtos/login-event-dto";
import type {
	ListRecentLoginsInput,
	LoginEventView,
} from "@core/application/dtos/login-event-dto.types";
import { toLoginEventView } from "@core/application/mappers/login-event-mapper";
import type { ListRecentLoginsDeps } from "@core/application/use-cases/list-recent-logins.types";

export function makeListRecentLogins({ loginEvents }: ListRecentLoginsDeps) {
	return async function listRecentLogins(
		input: ListRecentLoginsInput = {},
	): Promise<LoginEventView[]> {
		const { limit } = listRecentLoginsSchema.parse(input);
		const events = await loginEvents.listRecent(limit);
		return events.map(toLoginEventView);
	};
}
