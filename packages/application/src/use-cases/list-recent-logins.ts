import { listRecentLoginsSchema } from "@application/dtos/login-event-dto";
import type {
	ListRecentLoginsInput,
	LoginEventView,
} from "@application/dtos/login-event-dto.types";
import { toLoginEventView } from "@application/mappers/login-event-mapper";
import type { ListRecentLoginsDeps } from "@application/use-cases/list-recent-logins.types";

export function makeListRecentLogins({ loginEvents }: ListRecentLoginsDeps) {
	return async function listRecentLogins(
		input: ListRecentLoginsInput = {},
	): Promise<LoginEventView[]> {
		const { limit } = listRecentLoginsSchema.parse(input);
		const events = await loginEvents.listRecent(limit);
		return events.map(toLoginEventView);
	};
}
