import {
	CONFIRMED_PLEIAPP_PLAYER_SQL,
	isOperationalCancellationSql,
	isPlayedGameSql,
	OPENED_GAME_PLAYER_TYPE_SQL,
	OPERATIONAL_CANCELLATION_REASONS_SQL,
	QUALIFYING_OPENED_GAME_SQL,
} from "@server/infrastructure/repositories/warehouse/reservation-game-sql/reservation-game-sql";

describe("reservation-game-sql", () => {
	it("keeps the facility-panel scheduled and player predicates", () => {
		expect(OPERATIONAL_CANCELLATION_REASONS_SQL).toContain("Recurring game series");
		expect(isOperationalCancellationSql("r")).toContain("r.status = 'cancelled'");
		expect(isPlayedGameSql("g")).toBe("g.confirmed and g.status <> 'cancelled'");
		expect(QUALIFYING_OPENED_GAME_SQL).toContain("valid_player");
		expect(OPENED_GAME_PLAYER_TYPE_SQL).toContain("pleiapp_player");
		expect(CONFIRMED_PLEIAPP_PLAYER_SQL).toContain("dim_player");
	});
});
