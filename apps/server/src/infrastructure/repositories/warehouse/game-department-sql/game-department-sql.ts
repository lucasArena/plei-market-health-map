export const ORGANIZER_PARTNERS_CTE = `organizer_partners as (
  select distinct partner_id from plei_gold.fct_terms
  where name ilike '%Organizer Program%' and deleted_at is null
)`;

export function organizerPartnersJoin(reservation: string): string {
	return `left join organizer_partners op on op.partner_id = ${reservation}.partner_id`;
}

export function gameDepartmentCase(reservation: string): string {
	return `case
    when ${reservation}.partner_id in (6, 52, 62) then 'magic'
    when op.partner_id is not null then 'organizers'
    else 'partnerships' end`;
}
