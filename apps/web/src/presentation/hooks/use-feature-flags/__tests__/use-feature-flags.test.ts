import { act, renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import {
	useAdminFeatureFlags,
	useSetFeatureFlag,
} from "@/presentation/hooks/use-feature-flags/use-admin-feature-flags";
import {
	useFeatureFlag,
	useFeatureFlags,
} from "@/presentation/hooks/use-feature-flags/use-feature-flags";

function stubFetch(data: unknown) {
	const fetchMock = vi
		.fn()
		.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data }) });
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("feature flag hooks", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	it("loads the flags that are on", async () => {
		const fetchMock = stubFetch({ enabled: ["new-panel"] });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFeatureFlags(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.data).toEqual({ enabled: ["new-panel"] }));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/feature-flags");
	});

	it("answers whether one flag is on, and off while loading", async () => {
		stubFetch({ enabled: ["new-panel"] });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(
			() => ({
				on: useFeatureFlag("new-panel" as never),
				other: useFeatureFlag("other" as never),
			}),
			{ wrapper: Wrapper },
		);

		expect(result.current.on).toBe(false);
		await waitFor(() => expect(result.current.on).toBe(true));
		expect(result.current.other).toBe(false);
	});

	it("lists every flag for admins", async () => {
		const fetchMock = stubFetch([{ key: "new-panel", enabled: false }]);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useAdminFeatureFlags(), { wrapper: Wrapper });

		await waitFor(() =>
			expect(result.current.data).toEqual([{ key: "new-panel", enabled: false }]),
		);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/feature-flags/all");
	});

	it("switches a flag and reloads the flags", async () => {
		const fetchMock = stubFetch({ key: "new panel", enabled: true });
		const { Wrapper, client } = createQueryWrapper();
		const invalidate = vi.spyOn(client, "invalidateQueries");

		const { result } = renderHook(() => useSetFeatureFlag(), { wrapper: Wrapper });
		await act(() => result.current.mutateAsync({ key: "new panel", enabled: true }));

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/v1/feature-flags/new%20panel",
			expect.objectContaining({ method: "PUT", body: JSON.stringify({ enabled: true }) }),
		);
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ["feature-flags"] });
	});
});

it("enables flags immediately in local development even when saved settings are off", async () => {
	vi.stubEnv("NODE_ENV", "development");
	stubFetch({ enabled: [] });
	const { Wrapper } = createQueryWrapper();
	const { result } = renderHook(
		() => ({ flag: useFeatureFlag("insights-panel-v3"), query: useFeatureFlags() }),
		{ wrapper: Wrapper },
	);
	expect(result.current.flag).toBe(true);
	await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
	expect(result.current.flag).toBe(true);
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});
it("honors saved flag settings in production builds including staging", async () => {
	vi.stubEnv("NODE_ENV", "production");
	stubFetch({ enabled: [] });
	const { Wrapper } = createQueryWrapper();
	const { result } = renderHook(
		() => ({ flag: useFeatureFlag("insights-panel-v3"), query: useFeatureFlags() }),
		{ wrapper: Wrapper },
	);
	expect(result.current.flag).toBe(false);
	await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
	expect(result.current.flag).toBe(false);
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});
