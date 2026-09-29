import type { LoginEventRepository } from "@core/application/ports/login-event-repository.types";
import type { LoginEvent } from "@core/domain";

export class InMemoryLoginEventRepository implements LoginEventRepository {
	private readonly events = new Map<string, LoginEvent>();

	async save(event: LoginEvent): Promise<void> {
		this.events.set(event.sessionId, event);
	}

	async findBySessionId(sessionId: string): Promise<LoginEvent | null> {
		return this.events.get(sessionId) ?? null;
	}

	async listRecent(limit: number): Promise<LoginEvent[]> {
		return [...this.events.values()]
			.sort((a, b) => b.signedInAt.getTime() - a.signedInAt.getTime())
			.slice(0, limit);
	}
}
