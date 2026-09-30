import type { Clock } from "@core/application/providers/clock.types";
import type { IdGenerator } from "@core/application/providers/id-generator.types";
import type { LoginEventRepository } from "@core/application/repositories/login-event-repository.types";

export interface RecordLoginDeps {
	loginEvents: LoginEventRepository;
	ids: IdGenerator;
	clock: Clock;
}
