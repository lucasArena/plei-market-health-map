export const OPERATIONAL_CANCELLATION_REASONS_SQL =
	"cancellation_reason in ('Recurring game series', 'Operational changes')";

export function isOperationalCancellationSql(alias: string): string {
	return `${alias}.status = 'cancelled'
      and ${alias}.${OPERATIONAL_CANCELLATION_REASONS_SQL}`;
}

export function isPlayedGameSql(alias: string): string {
	return `${alias}.confirmed and ${alias}.status <> 'cancelled'`;
}

export const QUALIFYING_OPENED_GAME_SQL =
	"f.valid_player + 0 = 1 and f.confirmed_game + 0 = 1 and f.open_reservation_games + 0 = 1";

export const OPENED_GAME_PLAYER_TYPE_SQL =
	"f.dropping_date_local is null and f.players_type || '' = 'pleiapp_player'";

export const CONFIRMED_PLEIAPP_PLAYER_SQL = `exists (
      select 1
      from plei_gold.dim_player p
      where p.player_id = f.player_id
        and p.confirmed_at is not null and p.players_type = 'pleiapp_player'
    )`;
