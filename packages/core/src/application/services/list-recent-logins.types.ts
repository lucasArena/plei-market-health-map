import type { LoginEventRepository } from "@core/application/repositories/login-event-repository.types";

export interface ListRecentLoginsDeps {
	loginEvents: LoginEventRepository;
}
