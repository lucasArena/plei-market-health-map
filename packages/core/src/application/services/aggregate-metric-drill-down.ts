import {
	DRILL_DOWN_MEASURE_KIND,
	DRILL_DOWN_RANGE_DAYS,
} from "@core/application/dtos/metric-drill-down-dto";
import type {
	DrillDownMeasure,
	DrillDownSegment,
	DrillDownSlice,
	MetricDrillDownOrganizer,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import { confirmationRate } from "@core/application/mappers/facility-stats-mapper";
import type {
	AggregateCountDrillDownInput,
	DistinctCountContribution,
	DrillDownFacilityFact,
	DrillDownOrganizerFact,
	DrillDownRateMeasure,
	RateContribution,
	RateFactParts,
} from "@core/application/services/aggregate-metric-drill-down.types";
import type { GameDepartment, GameDepartmentCounts } from "@core/domain";
import { localDay, statsWindow } from "@core/domain";

export type {
	AggregateCountDrillDownInput,
	DistinctCountContribution,
	DrillDownFacilityFact,
	DrillDownOrganizerFact,
	RateContribution,
} from "@core/application/services/aggregate-metric-drill-down.types";

export const DRILL_DOWN_DEPARTMENTS = ["magic", "organizers", "partnerships"] as const;

export function drillDownRangeDays(range: MetricDrillDownView["range"]): number {
	return DRILL_DOWN_RANGE_DAYS[range];
}

export function drillDownWindow(
	now: Date,
	timeZone: string,
	range: MetricDrillDownView["range"],
): { start: string; end: string } {
	const { start, end } = statsWindow(localDay(now, timeZone), drillDownRangeDays(range));
	return { start, end };
}

function sumKnown(left: number | null, right: number | null): number | null {
	if (left === null || right === null) return null;
	return left + right;
}

function emptyDepartments(): Record<GameDepartment, number | null> {
	return { magic: 0, organizers: 0, partnerships: 0 };
}

export function organizerDisplayName(id: string, name?: string | null): string {
	const trimmed = name?.trim();
	return trimmed || `Organizer ${id}`;
}

function includesOrganizers(selectedDepartments: readonly GameDepartment[]): boolean {
	return selectedDepartments.includes("organizers");
}

function organizerCountValue(
	organizer: DrillDownOrganizerFact,
	measure: DrillDownMeasure,
): number | null {
	if (measure === "scheduled-games") return organizer.scheduled ?? organizer.games ?? null;
	if (measure === "active-facilities") return Number((organizer.games ?? 0) > 0);
	return organizer.games ?? null;
}

function mergeOrganizerCounts(
	current: MetricDrillDownOrganizer[] | null | undefined,
	incoming: readonly DrillDownOrganizerFact[] | null | undefined,
	facilityId: string,
	countOf: (organizer: DrillDownOrganizerFact) => number | null,
): MetricDrillDownOrganizer[] | null {
	if (incoming == null) return null;
	const byId = new Map((current ?? []).map((organizer) => [organizer.id, { ...organizer }]));
	for (const organizer of incoming) {
		const id = String(organizer.id);
		const row = byId.get(id) ?? {
			id,
			name: organizerDisplayName(id, organizer.name),
			value: 0,
			facilityIds: [],
		};
		row.value = sumKnown(row.value, countOf(organizer));
		row.facilityIds = [...new Set([...(row.facilityIds ?? []), facilityId])];
		byId.set(id, row);
	}
	return [...byId.values()];
}

function scopedFacilities(
	facilities: readonly DrillDownFacilityFact[],
	marketId?: string,
	facilityId?: string,
): DrillDownFacilityFact[] {
	return [...new Map(facilities.map((facility) => [facility.id, facility])).values()].filter(
		(facility) =>
			(!marketId || facility.marketId === marketId) && (!facilityId || facility.id === facilityId),
	);
}

export function aggregateCountDrillDown(input: AggregateCountDrillDownInput): MetricDrillDownView {
	const facilities = scopedFacilities(input.facilities, input.marketId, input.facilityId);
	const rows = new Map<string, MetricDrillDownRow>();
	let total: number | null = 0;
	const selectedDepartments = input.gameDepartments?.length
		? input.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	for (const facility of facilities) {
		const departments = facility.gamesByDepartment ? { ...facility.gamesByDepartment } : undefined;
		if (departments)
			for (const department of DRILL_DOWN_DEPARTMENTS)
				if (!selectedDepartments.includes(department)) departments[department] = 0;
		const filteredGames = departments
			? selectedDepartments.reduce((sum, department) => sum + departments[department], 0)
			: null;
		if (input.gameDepartments?.length && filteredGames === 0) continue;
		let value: number | null = input.gameDepartments?.length ? filteredGames : facility.games;
		if (input.department) value = departments?.[input.department] ?? null;
		if (input.measure === "active-facilities")
			value =
				input.gameDepartments?.length && filteredGames === null
					? null
					: Number((filteredGames ?? facility.games ?? 0) > 0);
		if (input.slice === "organizer" && !includesOrganizers(selectedDepartments)) continue;
		if (input.slice === "organizer" && facility.organizers == null) {
			total = sumKnown(total, null);
			continue;
		}
		const organizerGroups = (facility.organizers ?? []).map((organizer) => ({
			id: String(organizer.id),
			name: organizerDisplayName(String(organizer.id), organizer.name),
			groupValue: organizerCountValue(organizer, input.measure),
		}));
		if (input.slice === "organizer")
			value = organizerGroups.reduce<number | null>(
				(sum, group) => sumKnown(sum, group.groupValue),
				0,
			);
		total = sumKnown(total, value);
		const groups = {
			true: [
				{
					id: input.slice === "market" ? facility.marketId : facility.id,
					name: input.slice === "market" ? facility.marketName : facility.name,
					groupValue: value,
				},
			],
			[`${input.slice === "department"}`]: selectedDepartments.map((id) => ({
				id,
				name: id,
				groupValue: departments?.[id] ?? null,
			})),
			[`${input.slice === "organizer"}`]: organizerGroups,
		}.true;
		for (const group of groups) {
			const row = rows.get(group.id) ?? {
				id: group.id,
				name: group.name,
				value: 0,
				departments: emptyDepartments(),
				facilityIds: [],
			};
			row.value = sumKnown(row.value, group.groupValue);
			row.facilityIds = [...new Set([...(row.facilityIds ?? []), facility.id])];
			if (input.slice === "organizer" || !departments || !row.departments) row.departments = null;
			else
				for (const department of DRILL_DOWN_DEPARTMENTS)
					row.departments[department] =
						(row.departments[department] ?? 0) + departments[department];
			if (input.slice !== "organizer")
				row.organizers = mergeOrganizerCounts(
					row.organizers,
					facility.organizers,
					facility.id,
					(organizer) => organizerCountValue(organizer, input.measure),
				);
			if (input.segment === "facility")
				row.facilities = [
					...(row.facilities ?? []),
					{ id: facility.id, name: facility.name, value: group.groupValue },
				];
			rows.set(group.id, row);
		}
	}
	return {
		total,
		rows: [...rows.values()],
		start: input.start,
		end: input.end,
		measure: input.measure,
		range: input.range,
		kind: DRILL_DOWN_MEASURE_KIND[input.measure],
	};
}

function emptyDepartmentKeys(): Record<GameDepartment, Set<string>> {
	return { magic: new Set(), organizers: new Set(), partnerships: new Set() };
}

function contributionOrganizers(
	organizerKeys: Map<string, { name: string; keys: Set<string>; facilityIds: Set<string> }>,
): MetricDrillDownOrganizer[] {
	return [...organizerKeys.entries()].map(([id, organizer]) => ({
		id,
		name: organizer.name,
		value: organizer.keys.size,
		facilityIds: [...organizer.facilityIds],
	}));
}

function addFacilityIds(target: Set<string>, incoming?: readonly string[]): void {
	for (const id of incoming ?? []) target.add(id);
}

export function aggregateDistinctCountDrillDown(input: {
	contributions: readonly DistinctCountContribution[];
	sliceKeys: (contribution: DistinctCountContribution) => readonly { id: string; name: string }[];
	segment?: DrillDownSegment;
	department?: GameDepartment;
	gameDepartments?: readonly GameDepartment[];
	measure: DrillDownMeasure;
	range: MetricDrillDownView["range"];
	start: string;
	end: string;
}): MetricDrillDownView {
	const selectedDepartments = input.gameDepartments?.length
		? input.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	const rows = new Map<
		string,
		{
			id: string;
			name: string;
			keys: Set<string>;
			facilityIds: Set<string>;
			hasOrganizers: boolean;
			departmentKeys: Record<GameDepartment, Set<string>>;
			organizerKeys: Map<string, { name: string; keys: Set<string>; facilityIds: Set<string> }>;
			facilityKeys: Map<string, { name: string; keys: Set<string> }>;
		}
	>();
	const totalKeys = new Set<string>();
	for (const contribution of input.contributions) {
		const keys = input.department
			? (contribution.departments?.[input.department] ?? [])
			: contribution.memberKeys;
		for (const key of keys) totalKeys.add(key);
		for (const group of input.sliceKeys(contribution)) {
			const row = rows.get(group.id) ?? {
				id: group.id,
				name: group.name,
				keys: new Set<string>(),
				facilityIds: new Set<string>(),
				hasOrganizers: false,
				departmentKeys: emptyDepartmentKeys(),
				organizerKeys: new Map<
					string,
					{ name: string; keys: Set<string>; facilityIds: Set<string> }
				>(),
				facilityKeys: new Map<string, { name: string; keys: Set<string> }>(),
			};
			for (const key of keys) row.keys.add(key);
			if (contribution.facility) {
				const current = row.facilityKeys.get(contribution.facility.id) ?? {
					name: contribution.facility.name,
					keys: new Set<string>(),
				};
				for (const key of keys) current.keys.add(key);
				row.facilityKeys.set(contribution.facility.id, current);
			}
			addFacilityIds(row.facilityIds, contribution.facilityIds);
			for (const department of selectedDepartments) {
				for (const key of contribution.departments?.[department] ?? [])
					row.departmentKeys[department].add(key);
			}
			if (contribution.organizers != null) row.hasOrganizers = true;
			for (const organizer of contribution.organizers ?? []) {
				const current = row.organizerKeys.get(organizer.id) ?? {
					name: organizerDisplayName(organizer.id, organizer.name),
					keys: new Set<string>(),
					facilityIds: new Set<string>(),
				};
				for (const key of organizer.memberKeys) current.keys.add(key);
				addFacilityIds(current.facilityIds, organizer.facilityIds ?? contribution.facilityIds);
				row.organizerKeys.set(organizer.id, current);
			}
			rows.set(group.id, row);
		}
	}
	return {
		total: totalKeys.size,
		rows: [...rows.values()].map((row) => ({
			id: row.id,
			name: row.name,
			value: row.keys.size,
			facilityIds: [...row.facilityIds],
			departments: {
				magic: row.departmentKeys.magic.size,
				organizers: row.departmentKeys.organizers.size,
				partnerships: row.departmentKeys.partnerships.size,
			},
			organizers: row.hasOrganizers ? contributionOrganizers(row.organizerKeys) : null,
			...(input.segment === "facility"
				? {
						facilities: [...row.facilityKeys.entries()].map(([id, facility]) => ({
							id,
							name: facility.name,
							value: facility.keys.size,
						})),
					}
				: {}),
		})),
		start: input.start,
		end: input.end,
		measure: input.measure,
		range: input.range,
		kind: "distinct-count",
	};
}

export function rateValue(numerator: number | null, denominator: number | null): number | null {
	if (numerator === null || denominator === null || denominator === 0) return null;
	return numerator / denominator;
}

export function measureRateValue(
	measure: DrillDownMeasure,
	numerator: number | null,
	denominator: number | null,
): number | null {
	if (numerator === null || denominator === null) return null;
	if (DRILL_DOWN_MEASURE_KIND[measure] === "rate") return confirmationRate(numerator, denominator);
	return rateValue(numerator, denominator);
}

export function aggregateRateDrillDown(input: {
	contributions: readonly RateContribution[];
	segment?: DrillDownSegment;
	department?: GameDepartment;
	gameDepartments?: readonly GameDepartment[];
	measure: DrillDownMeasure;
	range: MetricDrillDownView["range"];
	start: string;
	end: string;
}): MetricDrillDownView {
	const selectedDepartments = input.gameDepartments?.length
		? input.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	const rows = new Map<
		string,
		{
			id: string;
			name: string;
			numerator: number | null;
			denominator: number | null;
			dataErrors: number;
			facilityIds: Set<string>;
			hasOrganizers: boolean;
			departments: Record<GameDepartment, { numerator: number | null; denominator: number | null }>;
			organizers: Map<
				string,
				{
					name: string;
					numerator: number | null;
					denominator: number | null;
					dataErrors: number;
					facilityIds: Set<string>;
				}
			>;
			facilities: Map<
				string,
				{ name: string; numerator: number | null; denominator: number | null; dataErrors: number }
			>;
		}
	>();
	let totalNumerator: number | null = 0;
	let totalDenominator: number | null = 0;
	let totalDataErrors = 0;
	const reportsDataErrors = input.contributions.some(
		(contribution) => contribution.dataErrors !== undefined,
	);
	for (const contribution of input.contributions) {
		const parts = input.department
			? (contribution.departments?.[input.department] ?? {
					numerator: null,
					denominator: null,
				})
			: contribution;
		totalNumerator = sumKnown(totalNumerator, parts.numerator);
		totalDenominator = sumKnown(totalDenominator, parts.denominator);
		const row = rows.get(contribution.id) ?? {
			id: contribution.id,
			name: contribution.name,
			numerator: 0,
			denominator: 0,
			dataErrors: 0,
			facilityIds: new Set<string>(),
			hasOrganizers: false,
			departments: {
				magic: { numerator: 0, denominator: 0 },
				organizers: { numerator: 0, denominator: 0 },
				partnerships: { numerator: 0, denominator: 0 },
			},
			organizers: new Map(),
			facilities: new Map(),
		};
		row.numerator = sumKnown(row.numerator, parts.numerator);
		row.denominator = sumKnown(row.denominator, parts.denominator);
		row.dataErrors += contribution.dataErrors ?? 0;
		if (contribution.facility) {
			const current = row.facilities.get(contribution.facility.id) ?? {
				name: contribution.facility.name,
				numerator: 0,
				denominator: 0,
				dataErrors: 0,
			};
			current.numerator = sumKnown(current.numerator, parts.numerator);
			current.denominator = sumKnown(current.denominator, parts.denominator);
			current.dataErrors += contribution.dataErrors ?? 0;
			row.facilities.set(contribution.facility.id, current);
		}
		totalDataErrors += contribution.dataErrors ?? 0;
		addFacilityIds(row.facilityIds, contribution.facilityIds);
		for (const department of selectedDepartments) {
			const departmentParts = contribution.departments?.[department] ?? {
				numerator: null,
				denominator: null,
			};
			row.departments[department] = {
				numerator: sumKnown(row.departments[department].numerator, departmentParts.numerator),
				denominator: sumKnown(row.departments[department].denominator, departmentParts.denominator),
			};
		}
		if (contribution.organizers != null) row.hasOrganizers = true;
		for (const organizer of contribution.organizers ?? []) {
			const current = row.organizers.get(organizer.id) ?? {
				name: organizerDisplayName(organizer.id, organizer.name),
				numerator: 0,
				denominator: 0,
				dataErrors: 0,
				facilityIds: new Set<string>(),
			};
			current.numerator = sumKnown(current.numerator, organizer.numerator);
			current.denominator = sumKnown(current.denominator, organizer.denominator);
			current.dataErrors += organizer.dataErrors ?? 0;
			addFacilityIds(current.facilityIds, organizer.facilityIds ?? contribution.facilityIds);
			row.organizers.set(organizer.id, current);
		}
		rows.set(contribution.id, row);
	}
	return {
		total: measureRateValue(input.measure, totalNumerator, totalDenominator),
		numerator: totalNumerator,
		denominator: totalDenominator,
		...(reportsDataErrors ? { dataErrors: totalDataErrors } : {}),
		rows: [...rows.values()].map((row) => ({
			id: row.id,
			name: row.name,
			value: measureRateValue(input.measure, row.numerator, row.denominator),
			numerator: row.numerator,
			denominator: row.denominator,
			facilityIds: [...row.facilityIds],
			...(reportsDataErrors ? { dataErrors: row.dataErrors } : {}),
			departments: {
				magic: measureRateValue(
					input.measure,
					row.departments.magic.numerator,
					row.departments.magic.denominator,
				),
				organizers: measureRateValue(
					input.measure,
					row.departments.organizers.numerator,
					row.departments.organizers.denominator,
				),
				partnerships: measureRateValue(
					input.measure,
					row.departments.partnerships.numerator,
					row.departments.partnerships.denominator,
				),
			},
			organizers: row.hasOrganizers
				? [...row.organizers.entries()].map(([id, organizer]) => ({
						id,
						name: organizer.name,
						value: measureRateValue(input.measure, organizer.numerator, organizer.denominator),
						numerator: organizer.numerator,
						denominator: organizer.denominator,
						facilityIds: [...organizer.facilityIds],
						...(reportsDataErrors ? { dataErrors: organizer.dataErrors } : {}),
					}))
				: null,
			...(input.segment === "facility"
				? {
						facilities: [...row.facilities.entries()].map(([id, facility]) => ({
							id,
							name: facility.name,
							value: measureRateValue(input.measure, facility.numerator, facility.denominator),
							numerator: facility.numerator,
							denominator: facility.denominator,
							...(reportsDataErrors ? { dataErrors: facility.dataErrors } : {}),
						})),
					}
				: {}),
		})),
		start: input.start,
		end: input.end,
		measure: input.measure,
		range: input.range,
		kind: "rate",
	};
}

export function scheduledFactsFrom(
	facilities: readonly DrillDownFacilityFact[],
): DrillDownFacilityFact[] {
	return facilities.map((facility) => ({
		...facility,
		games: facility.scheduled ?? facility.games,
		gamesByDepartment: facility.scheduledByDepartment ?? facility.gamesByDepartment,
		organizers: facility.organizers?.map((organizer) => ({
			...organizer,
			games: organizer.scheduled ?? organizer.games,
		})),
	}));
}

export function rateFactParts(
	facility: DrillDownFacilityFact,
	measure: DrillDownRateMeasure,
): RateFactParts {
	const parts = {
		"confirmation-rate": () => ({
			numerator: facility.games,
			denominator: facility.scheduled ?? null,
			numeratorByDepartment: facility.gamesByDepartment,
			denominatorByDepartment: facility.scheduledByDepartment ?? null,
		}),
		"almost-filled-rate": () => ({
			numerator: facility.almostFilled ?? null,
			denominator: facility.rosteredCanceled ?? null,
			numeratorByDepartment: facility.almostFilledByDepartment ?? null,
			denominatorByDepartment: facility.rosteredCanceledByDepartment ?? null,
			dataErrors: facility.missingRoster ?? 0,
			dataErrorsByDepartment: facility.missingRosterByDepartment ?? null,
		}),
		"incident-games-rate": () => ({
			numerator: facility.incidentGames ?? null,
			denominator: facility.games,
			numeratorByDepartment: facility.incidentGamesByDepartment ?? null,
			denominatorByDepartment: facility.gamesByDepartment,
		}),
	};
	return parts[measure]();
}

function isRateMeasure(measure: DrillDownMeasure): measure is DrillDownRateMeasure {
	return DRILL_DOWN_MEASURE_KIND[measure] === "rate";
}

function organizerRateParts(
	organizer: DrillDownOrganizerFact,
	measure: DrillDownRateMeasure,
): { numerator: number | null; denominator: number | null; dataErrors?: number } {
	const parts = {
		"confirmation-rate": () => ({
			numerator: organizer.games ?? null,
			denominator: organizer.scheduled ?? null,
		}),
		"almost-filled-rate": () => ({
			numerator: organizer.almostFilled ?? null,
			denominator: organizer.rosteredCanceled ?? null,
			dataErrors: organizer.missingRoster ?? 0,
		}),
		"incident-games-rate": () => ({
			numerator: organizer.incidentGames ?? null,
			denominator: organizer.games ?? null,
		}),
	};
	return parts[measure]();
}

function rateOrganizersFrom(
	facility: DrillDownFacilityFact,
	measure: DrillDownRateMeasure,
	reportsErrors: boolean,
): RateContribution[] | null {
	if (facility.organizers == null) return null;
	return facility.organizers.map((organizer) => {
		const parts = organizerRateParts(organizer, measure);
		return {
			id: String(organizer.id),
			name: organizerDisplayName(String(organizer.id), organizer.name),
			numerator: parts.numerator,
			denominator: parts.denominator,
			facilityIds: [facility.id],
			...(reportsErrors ? { dataErrors: parts.dataErrors ?? 0 } : {}),
		};
	});
}

function distinctOrganizersFrom(
	facility: DrillDownFacilityFact,
	measure: Extract<DrillDownMeasure, "unique-players" | "activated-players" | "active-organizers">,
):
	| { id: string; name: string; memberKeys: readonly string[]; facilityIds: readonly string[] }[]
	| null {
	if (measure === "active-organizers") {
		const names = new Map(
			(facility.organizers ?? []).map((organizer) => [String(organizer.id), organizer.name]),
		);
		return (facility.activeOrganizerIds ?? []).map((id) => ({
			id: String(id),
			name: organizerDisplayName(String(id), names.get(String(id))),
			memberKeys: [String(id)],
			facilityIds: [facility.id],
		}));
	}
	if (facility.organizers == null) return null;
	return facility.organizers.map((organizer) => ({
		id: String(organizer.id),
		name: organizerDisplayName(String(organizer.id), organizer.name),
		memberKeys:
			measure === "unique-players"
				? (organizer.uniquePlayerIds ?? [])
				: (organizer.activatedPlayerIds ?? []),
		facilityIds: [facility.id],
	}));
}

export function rateContributionsFromFacts(
	facilities: readonly DrillDownFacilityFact[],
	slice: DrillDownSlice,
	options: {
		measure?: DrillDownMeasure;
		marketId?: string;
		facilityId?: string;
		gameDepartments?: readonly GameDepartment[];
	} = {},
): RateContribution[] {
	const measure =
		options.measure && isRateMeasure(options.measure) ? options.measure : "confirmation-rate";
	const selectedDepartments = options.gameDepartments?.length
		? options.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	return scopedFacilities(facilities, options.marketId, options.facilityId).flatMap(
		(facility): RateContribution[] => {
			const parts = rateFactParts(facility, measure);
			const numerators = parts.numeratorByDepartment;
			const denominators = parts.denominatorByDepartment;
			const departments =
				numerators && denominators
					? {
							magic: { numerator: numerators.magic, denominator: denominators.magic },
							organizers: {
								numerator: numerators.organizers,
								denominator: denominators.organizers,
							},
							partnerships: {
								numerator: numerators.partnerships,
								denominator: denominators.partnerships,
							},
						}
					: null;
			const reportsErrors = parts.dataErrors !== undefined;
			const organizers = rateOrganizersFrom(facility, measure, reportsErrors);
			const origin = { id: facility.id, name: facility.name };
			if (slice === "department")
				return selectedDepartments.map((department) => ({
					id: department,
					name: department,
					numerator: departments?.[department].numerator ?? null,
					denominator: departments?.[department].denominator ?? null,
					facility: origin,
					facilityIds: [facility.id],
					...(reportsErrors ? { dataErrors: parts.dataErrorsByDepartment?.[department] ?? 0 } : {}),
				}));
			if (slice === "organizer") {
				if (!includesOrganizers(selectedDepartments)) return [];
				return (organizers ?? []).map((organizer) => ({ ...organizer, facility: origin }));
			}
			return [
				{
					id: slice === "market" ? facility.marketId : facility.id,
					name: slice === "market" ? facility.marketName : facility.name,
					numerator: parts.numerator,
					denominator: parts.denominator,
					facility: origin,
					facilityIds: [facility.id],
					...(reportsErrors ? { dataErrors: parts.dataErrors } : {}),
					departments,
					...(organizers != null ? { organizers } : {}),
				},
			];
		},
	);
}

export function distinctContributionsFromFacts(
	facilities: readonly DrillDownFacilityFact[],
	slice: DrillDownSlice,
	measure: Extract<DrillDownMeasure, "unique-players" | "activated-players" | "active-organizers">,
	options: {
		marketId?: string;
		facilityId?: string;
		gameDepartments?: readonly GameDepartment[];
	} = {},
): DistinctCountContribution[] {
	const selectedDepartments = options.gameDepartments?.length
		? options.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	return scopedFacilities(facilities, options.marketId, options.facilityId).flatMap(
		(facility): DistinctCountContribution[] => {
			const memberKeys =
				{
					"unique-players": facility.uniquePlayerIds,
					"activated-players": facility.activatedPlayerIds,
					"active-organizers": facility.activeOrganizerIds,
				}[measure] ?? [];
			const source = {
				"unique-players": facility.uniquePlayerIdsByDepartment,
				"activated-players": facility.activatedPlayerIdsByDepartment,
				"active-organizers": null,
			}[measure];
			const departments = {
				magic: source?.magic ?? [],
				organizers: source?.organizers ?? [],
				partnerships: source?.partnerships ?? [],
			};
			const organizers = distinctOrganizersFrom(facility, measure);
			const origin = { id: facility.id, name: facility.name };
			if (slice === "department")
				return selectedDepartments.map((department) => ({
					id: department,
					name: department,
					memberKeys: departments[department],
					facility: origin,
					facilityIds: [facility.id],
				}));
			if (slice === "organizer") {
				if (!includesOrganizers(selectedDepartments)) return [];
				return (organizers ?? []).map((organizer) => ({
					id: organizer.id,
					name: organizer.name,
					memberKeys: organizer.memberKeys,
					facility: origin,
					facilityIds: organizer.facilityIds,
				}));
			}
			return [
				{
					id: slice === "market" ? facility.marketId : facility.id,
					name: slice === "market" ? facility.marketName : facility.name,
					memberKeys,
					facility: origin,
					facilityIds: [facility.id],
					departments,
					...(organizers != null ? { organizers } : {}),
				},
			];
		},
	);
}

export function aggregateDrillDownFromFacts(
	input: AggregateCountDrillDownInput,
): MetricDrillDownView {
	if (isRateMeasure(input.measure))
		return aggregateRateDrillDown({
			contributions: rateContributionsFromFacts(input.facilities, input.slice, input),
			segment: input.segment,
			department: input.department,
			gameDepartments: input.gameDepartments,
			measure: input.measure,
			range: input.range,
			start: input.start,
			end: input.end,
		});
	if (
		input.measure === "unique-players" ||
		input.measure === "activated-players" ||
		input.measure === "active-organizers"
	)
		return aggregateDistinctCountDrillDown({
			contributions: distinctContributionsFromFacts(
				input.facilities,
				input.slice,
				input.measure,
				input,
			),
			sliceKeys: (contribution) => [{ id: contribution.id, name: contribution.name }],
			segment: input.segment,
			department: input.department,
			gameDepartments: input.gameDepartments,
			measure: input.measure,
			range: input.range,
			start: input.start,
			end: input.end,
		});
	const countFacts: Partial<Record<DrillDownMeasure, () => DrillDownFacilityFact[]>> = {
		"scheduled-games": () => scheduledFactsFrom(input.facilities),
	};
	return aggregateCountDrillDown({
		...input,
		facilities: countFacts[input.measure]?.() ?? input.facilities,
	});
}

export function factsFromFacilityPoints(
	facilities: readonly {
		id: string;
		name: string;
		marketId: string;
		marketName: string;
		gamesLast28Days?: number;
		gamesLastWeek?: number;
		gamesByDepartment?: GameDepartmentCounts;
		gamesLastWeekByDepartment?: GameDepartmentCounts;
	}[],
	range: MetricDrillDownView["range"],
): DrillDownFacilityFact[] {
	const useWeek = range === "7d";
	return facilities.map((facility) => ({
		id: facility.id,
		name: facility.name,
		marketId: facility.marketId,
		marketName: facility.marketName,
		games: useWeek ? (facility.gamesLastWeek ?? null) : (facility.gamesLast28Days ?? null),
		gamesByDepartment: useWeek
			? (facility.gamesLastWeekByDepartment ?? null)
			: (facility.gamesByDepartment ?? null),
	}));
}
