export { Facility } from "@core/domain/entities/facility/facility";
export type {
	FacilityMetrics,
	FacilityProps,
	GameDepartment,
	GameDepartmentCounts,
} from "@core/domain/entities/facility/facility.types";
export {
	GAME_DEPARTMENTS,
	normalizeGameDepartments,
	sumGameDepartments,
} from "@core/domain/entities/game-department/game-department";
export {
	classifyGamesTrend,
	GAMES_WINDOW_DAYS,
	gamesTrend,
} from "@core/domain/entities/games-trend/games-trend";
export type {
	GamesTrend,
	GamesTrendLevel,
} from "@core/domain/entities/games-trend/games-trend.types";
export { LoginEvent } from "@core/domain/entities/login-event/login-event";
export type {
	CreateLoginEventInput,
	LoginEventProps,
} from "@core/domain/entities/login-event/login-event.types";
export {
	HEALTHY_SCORE,
	MARKET_HEALTH_STATUSES,
	Market,
	WATCH_SCORE,
} from "@core/domain/entities/market/market";
export type {
	MarketHealthStatus,
	MarketMetrics,
	MarketProps,
} from "@core/domain/entities/market/market.types";
export { DomainError, ValidationError } from "@core/domain/shared/domain-error";
export { addDays, easternDay } from "@core/domain/shared/eastern-calendar";
export { hasEmailDomain } from "@core/domain/shared/email-domain";
export type { GeoPoint } from "@core/domain/shared/geo-point.types";
export { guard } from "@core/domain/shared/guard";
export { asEntityId } from "@core/domain/shared/id";
export type { EntityId } from "@core/domain/shared/id.types";
export { lastCompletedWeekStart, weekEndOf, weekStartOf } from "@core/domain/shared/week";
