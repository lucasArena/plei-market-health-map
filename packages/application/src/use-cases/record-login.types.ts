import type { Clock } from "@application/ports/clock.types";
import type { IdGenerator } from "@application/ports/id-generator.types";
import type { LoginEventRepository } from "@application/ports/login-event-repository.types";

export interface RecordLoginDeps {
	loginEvents: LoginEventRepository;
	ids: IdGenerator;
	clock: Clock;
}
