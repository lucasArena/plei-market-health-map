import type { LoginEventRepository } from "@application/ports/login-event-repository.types";

export interface ListRecentLoginsDeps {
	loginEvents: LoginEventRepository;
}
