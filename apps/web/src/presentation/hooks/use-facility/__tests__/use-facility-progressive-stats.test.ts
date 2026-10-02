import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { prefetchFacilityStats } from "@/presentation/hooks/use-facility/prefetch-facility-stats";
import {
	facilityPlayerStatsQueryKey,
	useFacilityPlayerStats,
} from "@/presentation/hooks/use-facility/use-facility-player-stats";
import {
	facilityReservationStatsQueryKey,
	useFacilityReservationStats,
} from "@/presentation/hooks/use-facility/use-facility-reservation-stats";

describe("progressive facility stats hooks", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches reservation analytics independently", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: { facility: { id: "889" }, stats: {} } }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFacilityReservationStats("889"), {
			wrapper: Wrapper,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/facilities/889/reservations");
		expect(facilityReservationStatsQueryKey("889")).toEqual([
			"facilities",
			"detail",
			"889",
			"reservations",
		]);
	});

	it("fetches player analytics independently", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: { uniquePlayersLast28Days: 32 } }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFacilityPlayerStats("889"), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/facilities/889/players");
		expect(facilityPlayerStatsQueryKey("889")).toEqual(["facilities", "detail", "889", "players"]);
	});

	it("prefetches reservation and player analytics together and stays idle without a selection", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: { facility: { id: "889" }, stats: {} } }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { client, Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFacilityReservationStats(null), {
			wrapper: Wrapper,
		});
		const players = renderHook(() => useFacilityPlayerStats(null), { wrapper: Wrapper });
		expect(result.current.fetchStatus).toBe("idle");
		expect(players.result.current.fetchStatus).toBe("idle");

		await prefetchFacilityStats(client, "889");

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls.map(([url]) => url).sort()).toEqual([
			"/api/v1/facilities/889/players",
			"/api/v1/facilities/889/reservations",
		]);
		expect(client.getQueryData(facilityPlayerStatsQueryKey("889"))).toBeDefined();
		expect(client.getQueryData(facilityReservationStatsQueryKey("889"))).toEqual({
			facility: { id: "889" },
			stats: {},
		});
	});
});
