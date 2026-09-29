import type { LoginEventRepository } from "@core/application/ports/login-event-repository.types";

export interface ListRecentLoginsDeps {
	loginEvents: LoginEventRepository;
}
