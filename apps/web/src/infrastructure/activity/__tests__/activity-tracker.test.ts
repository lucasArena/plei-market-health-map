import {
	ACTIVITY_ENDPOINT,
	ActivityTracker,
	activityTracker,
	REPORTED_DAY_KEY,
} from "@/infrastructure/activity/activity-tracker";

function setup(start = "2026-09-30T15:00:00Z") {
	let now = new Date(start).getTime();
	const fetch = vi.fn().mockResolvedValue({});
	const sendBeacon = vi.fn().mockReturnValue(true);
	const tracker = new ActivityTracker({
		now: () => new Date(now),
		storage: () => localStorage,
		fetch,
		sendBeacon,
	});
	const beacons = () => sendBeacon.mock.calls.map(([, body]) => JSON.parse(body as string));
	return { tracker, fetch, sendBeacon, beacons, advance: (ms: number) => (now += ms) };
}

describe("ActivityTracker", () => {
	beforeEach(() => localStorage.clear());

	it("reports the first visit of the day right away, once", () => {
		const { tracker, fetch } = setup();

		tracker.start();
		tracker.start();

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			ACTIVITY_ENDPOINT,
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ visits: 1 }),
				keepalive: true,
			}),
		);
		expect(localStorage.getItem(REPORTED_DAY_KEY)).toBe("2026-09-30");
	});

	it("sends later visits, minutes and feature counts in one beacon when the tab is hidden", () => {
		localStorage.setItem(REPORTED_DAY_KEY, "2026-09-30");
		const { tracker, fetch, beacons, advance } = setup();

		tracker.start();
		tracker.count("facilitiesOpened");
		tracker.count("facilitiesOpened");
		tracker.count("searches");
		advance(7.5 * 60_000);
		tracker.pause();

		expect(fetch).not.toHaveBeenCalled();
		expect(beacons()).toEqual([
			{
				minutes: 7,
				visits: 1,
				counters: {
					facilitiesOpened: 2,
					marketSummariesOpened: 0,
					searches: 1,
					aiSummaries: 0,
					feedbackSent: 0,
				},
			},
		]);

		tracker.resume();
		advance(30_000);
		tracker.pause();
		expect(beacons().at(-1)).toMatchObject({ minutes: 1, visits: 0 });
	});

	it("sends nothing when there is nothing new, and retries when the beacon is refused", () => {
		const { tracker, sendBeacon, beacons, advance } = setup();
		tracker.start();
		tracker.pause();
		expect(sendBeacon).not.toHaveBeenCalled();

		sendBeacon.mockReturnValueOnce(false);
		tracker.count("aiSummaries");
		tracker.flush();
		tracker.flush();

		expect(beacons()).toHaveLength(2);
		expect(beacons()[1]).toMatchObject({ counters: { aiSummaries: 1 } });
		advance(1);
	});

	it("flushes on stop and counts a new visit on a new day", () => {
		const { tracker, fetch, beacons, advance } = setup();
		tracker.start();
		tracker.count("feedbackSent");
		tracker.stop();
		expect(beacons()).toHaveLength(1);

		advance(24 * 60 * 60_000);
		tracker.start();
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("still works when storage is blocked", () => {
		const fetch = vi.fn().mockResolvedValue({});
		const broken = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("blocked");
			},
		} as unknown as Storage;
		const tracker = new ActivityTracker({ storage: () => broken, fetch, sendBeacon: vi.fn() });

		expect(() => tracker.start()).not.toThrow();
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("uses the browser by default", () => {
		const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(new Response(null));
		Object.defineProperty(navigator, "sendBeacon", {
			configurable: true,
			value: vi.fn(() => true),
		});
		const tracker = new ActivityTracker();

		tracker.start();
		tracker.count("searches");
		tracker.flush();

		expect(fetchSpy).toHaveBeenCalledWith(ACTIVITY_ENDPOINT, expect.any(Object));
		expect(navigator.sendBeacon).toHaveBeenCalledWith(ACTIVITY_ENDPOINT, expect.any(Blob));
		expect(activityTracker).toBeInstanceOf(ActivityTracker);
		fetchSpy.mockRestore();
		Reflect.deleteProperty(navigator, "sendBeacon");
	});

	it("reports no beacon support as a refused beacon", () => {
		const tracker = new ActivityTracker({ fetch: vi.fn().mockResolvedValue({}) });
		tracker.count("searches");
		expect(() => tracker.flush()).not.toThrow();
	});
});
