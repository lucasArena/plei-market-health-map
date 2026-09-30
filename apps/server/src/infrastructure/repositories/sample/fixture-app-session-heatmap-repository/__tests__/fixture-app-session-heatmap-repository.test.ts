import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	FixtureAppSessionHeatmapRepository,
	parseAppSessionHeatmapCsv,
} from "@server/infrastructure/repositories/sample/fixture-app-session-heatmap-repository/fixture-app-session-heatmap-repository";

describe("parseAppSessionHeatmapCsv", () => {
	it("maps lat,lng,session_weight rows and skips invalid weights", () => {
		const csv = [
			"lat,lng,session_weight,distinct_players",
			"29.746,-95.352,1134,62",
			"1,2,0,1",
			"x,y,z,1",
			"25.774,-80.194,688,86",
		].join("\n");

		expect(parseAppSessionHeatmapCsv(csv)).toEqual([
			{ lat: 29.746, lng: -95.352, sessionWeight: 1134 },
			{ lat: 25.774, lng: -80.194, sessionWeight: 688 },
		]);
	});

	it("returns an empty list for blank or header-only input", () => {
		expect(parseAppSessionHeatmapCsv("")).toEqual([]);
		expect(parseAppSessionHeatmapCsv("lat,lng,session_weight\n")).toEqual([]);
		expect(parseAppSessionHeatmapCsv("a,b,c\n1,2,3")).toEqual([]);
	});
});

describe("FixtureAppSessionHeatmapRepository", () => {
	it("loads cells from a CSV fixture path", async () => {
		const dir = mkdtempSync(join(tmpdir(), "heatmap-fixture-"));
		const path = join(dir, "cells.csv");
		writeFileSync(path, "lat,lng,session_weight\n29.746,-95.352,1134\n");

		const repository = new FixtureAppSessionHeatmapRepository(path);
		await expect(repository.listLast28Days()).resolves.toEqual([
			{ lat: 29.746, lng: -95.352, sessionWeight: 1134 },
		]);
		await expect(repository.listLast28Days()).resolves.toEqual([
			{ lat: 29.746, lng: -95.352, sessionWeight: 1134 },
		]);
	});
});
