/**
 * The warehouse rules that sort a reservation into a game department, shared by the facility
 * list (per department counts on the map) and the reservation stats (the summary panel), so
 * both always agree on which games belong to which department.
 */
export const ORGANIZER_PARTNERS_CTE = `organizer_partners as (
  select distinct partner_id from plei_gold.fct_terms
  where name ilike '%Organizer Program%' and deleted_at is null
)`;

/** Joins `organizer_partners` as `op` to the reservation alias; one row per reservation. */
export function organizerPartnersJoin(reservation: string): string {
	return `left join organizer_partners op on op.partner_id = ${reservation}.partner_id`;
}

/** The department of a reservation joined with `organizerPartnersJoin`. */
export function gameDepartmentCase(reservation: string): string {
	return `case
    when ${reservation}.partner_id in (6, 52, 62) then 'magic'
    when op.partner_id is not null then 'organizers'
    else 'partnerships' end`;
}
