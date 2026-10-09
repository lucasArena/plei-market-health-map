import {
	MARKET_AUDIENCE_SQL,
	toMarketAudienceCounts,
	WarehouseMarketAudienceRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-market-audience-repository/warehouse-market-audience-repository";

const TODAY = "2026-10-08";

const ROW = {
	active_last_week: "5590",
	active_previous_week: "5474",
	active_last_28_days: "10733",
	active_previous_28_days: "11270",
	registrations_last_week: "359",
	registrations_previous_week: "353",
	registrations_last_28_days: 1312,
	registrations_previous_28_days: 1329,
};

function setup(rows: unknown[] = [ROW]) {
	const query = vi.fn().mockResolvedValue({ rows });
	return { query, repository: new WarehouseMarketAudienceRepository({ query }) };
}

describe("WarehouseMarketAudienceRepository", () => {
	it("binds today and a null market for all markets", async () => {
		const { query, repository } = setup();

		await repository.getAudience(null, TODAY);

		expect(query).toHaveBeenCalledWith(MARKET_AUDIENCE_SQL, [TODAY, null]);
	});

	it("binds the region id for a market", async () => {
		const { query, repository } = setup();

		await repository.getAudience("2", TODAY);

		expect(query).toHaveBeenCalledWith(MARKET_AUDIENCE_SQL, [TODAY, "2"]);
	});

	it("returns an empty audience for a market without a region id, without querying", async () => {
		const { query, repository } = setup();

		const counts = await repository.getAudience("unassigned", TODAY);

		expect(query).not.toHaveBeenCalled();
		expect(counts.week).toEqual({
			activeUsers: 0,
			activeUsersPrevious: 0,
			registrations: 0,
			registrationsPrevious: 0,
		});
		expect(counts.month).toEqual(counts.week);
	});

	it("fails loudly when the warehouse returns no row", async () => {
		const { repository } = setup([]);

		await expect(repository.getAudience(null, TODAY)).rejects.toThrow(
			"No audience row returned for market all.",
		);
		await expect(repository.getAudience("2", TODAY)).rejects.toThrow(
			"No audience row returned for market 2.",
		);
	});

	it("counts distinct active players by date and never sums sessions", () => {
		expect(MARKET_AUDIENCE_SQL).toContain("count(distinct a.player_id)");
		expect(MARKET_AUDIENCE_SQL).not.toContain("q_sessions");
		expect(MARKET_AUDIENCE_SQL).toContain("s.plei_region = (");
		expect(MARKET_AUDIENCE_SQL).toContain("p.region_id = $2::bigint");
		expect(MARKET_AUDIENCE_SQL).toContain("p.players_type = 'pleiapp_player'");
		expect(MARKET_AUDIENCE_SQL).toContain("a.date >= b.today - 7 and a.date < b.today");
		expect(MARKET_AUDIENCE_SQL).toContain("a.date >= b.today - 56 and a.date < b.today - 28");
	});
});

describe("toMarketAudienceCounts", () => {
	it("maps both periods to numbers", () => {
		expect(toMarketAudienceCounts(ROW)).toEqual({
			week: {
				activeUsers: 5590,
				activeUsersPrevious: 5474,
				registrations: 359,
				registrationsPrevious: 353,
			},
			month: {
				activeUsers: 10733,
				activeUsersPrevious: 11270,
				registrations: 1312,
				registrationsPrevious: 1329,
			},
		});
	});
});
