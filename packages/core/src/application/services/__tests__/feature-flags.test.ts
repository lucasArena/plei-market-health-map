import { FEATURE_FLAG_KEYS } from "@core/application/dtos/feature-flags-dto";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { makeListEnabledFeatureFlags } from "@core/application/services/list-enabled-feature-flags";
import { makeListFeatureFlags } from "@core/application/services/list-feature-flags";
import { makeSetFeatureFlag } from "@core/application/services/set-feature-flag";
import { InMemoryFeatureFlagRepository } from "@core/application/testing/in-memory-feature-flag-repository";

const NOW = new Date("2026-10-01T15:00:00Z");
const clock = { now: () => NOW };
const KEYS = ["new-panel", "demographic-filters"];

function setup() {
	const featureFlags = new InMemoryFeatureFlagRepository([
		{
			key: "new-panel",
			enabled: true,
			updatedBy: "lucas@plei.com",
			updatedAt: new Date("2026-09-30T10:00:00Z"),
		},
		{
			key: "removed-flag",
			enabled: true,
			updatedBy: "lucas@plei.com",
			updatedAt: new Date("2026-09-01T10:00:00Z"),
		},
	]);
	return {
		featureFlags,
		listEnabled: makeListEnabledFeatureFlags({ featureFlags, keys: KEYS }),
		list: makeListFeatureFlags({ featureFlags, keys: KEYS }),
		set: makeSetFeatureFlag({ featureFlags, clock, keys: KEYS }),
	};
}

describe("feature flags", () => {
	it("lists only the flags in code that are switched on", async () => {
		const { listEnabled } = setup();

		await expect(listEnabled()).resolves.toEqual({ enabled: ["new-panel"] });
	});

	it("lists every flag in code, off when it has never been switched", async () => {
		const { list } = setup();

		await expect(list()).resolves.toEqual([
			{
				key: "new-panel",
				enabled: true,
				updatedBy: "lucas@plei.com",
				updatedAt: "2026-09-30T10:00:00.000Z",
			},
			{ key: "demographic-filters", enabled: false, updatedBy: null, updatedAt: null },
		]);
	});

	it("switches a flag and records who did it and when", async () => {
		const { set, listEnabled, featureFlags } = setup();

		await expect(
			set({ key: "demographic-filters", enabled: true, updatedBy: " Stefano@plei.com " }),
		).resolves.toEqual({
			key: "demographic-filters",
			enabled: true,
			updatedBy: "stefano@plei.com",
			updatedAt: "2026-10-01T15:00:00.000Z",
		});
		await set({ key: "new-panel", enabled: false, updatedBy: "tomas@plei.com" });

		await expect(listEnabled()).resolves.toEqual({ enabled: ["demographic-filters"] });
		expect(featureFlags.records.get("new-panel")?.updatedBy).toBe("tomas@plei.com");
	});

	it("refuses flags that are not in code and malformed requests", async () => {
		const { set } = setup();

		await expect(
			set({ key: "removed-flag", enabled: true, updatedBy: "lucas@plei.com" }),
		).rejects.toBeInstanceOf(NotFoundError);
		await expect(
			set({ key: "new-panel", enabled: "yes", updatedBy: "lucas@plei.com" }),
		).rejects.toBeInstanceOf(InvalidRequestError);
		await expect(
			set({ key: " ", enabled: true, updatedBy: "lucas@plei.com" }),
		).rejects.toBeInstanceOf(InvalidRequestError);
	});

	it("uses the flags declared in code by default", async () => {
		const featureFlags = new InMemoryFeatureFlagRepository();

		await expect(makeListFeatureFlags({ featureFlags })()).resolves.toHaveLength(
			FEATURE_FLAG_KEYS.length,
		);
		await expect(makeListEnabledFeatureFlags({ featureFlags })()).resolves.toEqual({ enabled: [] });
		await expect(
			makeSetFeatureFlag({ featureFlags, clock })({
				key: "anything",
				enabled: true,
				updatedBy: "lucas@plei.com",
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});
});
