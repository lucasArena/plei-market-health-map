import type { Clock } from "@core/application/ports/clock.types";
import type { IdGenerator } from "@core/application/ports/id-generator.types";
import type { LoginEventRepository } from "@core/application/ports/login-event-repository.types";

export interface RecordLoginDeps {
	loginEvents: LoginEventRepository;
	ids: IdGenerator;
	clock: Clock;
}
