import type { LoginEvent } from "@market-health-map/domain";

export interface LoginEventRepository {
	save(event: LoginEvent): Promise<void>;
	findBySessionId(sessionId: string): Promise<LoginEvent | null>;
	listRecent(limit: number): Promise<LoginEvent[]>;
}
