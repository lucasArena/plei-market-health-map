import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import {
	useAppSessionFilterOptions,
	useAppSessionHeatmap,
} from "@/presentation/hooks/use-app/use-app-session-heatmap";

describe("useAppSessionFilterOptions", () => {
	it("does not fetch options while disabled", () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();
		renderHook(() => useAppSessionFilterOptions(false), { wrapper: Wrapper });
		expect(fetchMock).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});
});

describe("useAppSessionHeatmap", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the app session heatmap", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: [{ lat: 29.75, lng: -95.35, sessionWeight: 10 }] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useAppSessionHeatmap(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ lat: 29.75, lng: -95.35, sessionWeight: 10 }]);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/app-session-heatmap?period=week");
	});
});

it("encodes combined demographics in the request and caches separate cohorts", async () => {
	const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
	vi.stubGlobal("fetch", fetchMock);
	const { Wrapper } = createQueryWrapper();
	const { result, rerender } = renderHook(
		({ gender }) => useAppSessionHeatmap({ gender, ageMin: 25, ageMax: 34 }),
		{ wrapper: Wrapper, initialProps: { gender: "Female & other" } },
	);
	await waitFor(() => expect(result.current.isSuccess).toBe(true));
	expect(fetchMock.mock.calls[0]?.[0]).toBe(
		"/api/v1/app-session-heatmap?period=week&gender=Female+%26+other&ageMin=25&ageMax=34",
	);
	rerender({ gender: "Male" });
	await waitFor(() => expect(result.current.isSuccess).toBe(true));
	expect(fetchMock).toHaveBeenCalledTimes(2);
	rerender({ gender: "Female & other" });
	expect(result.current.isSuccess).toBe(true);
	expect(fetchMock).toHaveBeenCalledTimes(2);
	vi.unstubAllGlobals();
});
it("sorts array demographics in the query string", async () => {
	const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
	vi.stubGlobal("fetch", fetchMock);
	const { Wrapper } = createQueryWrapper();
	const { result } = renderHook(() => useAppSessionHeatmap({ skill: ["Advanced", "Beginner"] }), {
		wrapper: Wrapper,
	});
	await waitFor(() => expect(result.current.isSuccess).toBe(true));
	expect(fetchMock.mock.calls[0]?.[0]).toBe(
		"/api/v1/app-session-heatmap?period=week&skill=Advanced&skill=Beginner",
	);
	vi.unstubAllGlobals();
});

it("requests registrations for the selected period", async () => {
	const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
	vi.stubGlobal("fetch", fetchMock);
	const { Wrapper } = createQueryWrapper();
	const { result } = renderHook(
		() => useAppSessionHeatmap({ metric: "registrations" }, "month", true),
		{ wrapper: Wrapper },
	);
	await waitFor(() => expect(result.current.isSuccess).toBe(true));
	expect(fetchMock.mock.calls[0]?.[0]).toBe(
		"/api/v1/app-session-heatmap?period=month&metric=registrations",
	);
	vi.unstubAllGlobals();
});

it("does not fetch a hidden sessions layer", () => {
	const fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	const { Wrapper } = createQueryWrapper();
	renderHook(() => useAppSessionHeatmap({}, "week", false), { wrapper: Wrapper });
	expect(fetchMock).not.toHaveBeenCalled();
	vi.unstubAllGlobals();
});
