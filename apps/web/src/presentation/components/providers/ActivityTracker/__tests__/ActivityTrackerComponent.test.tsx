import { render } from "@testing-library/react";
import { ActivityTracker } from "@/presentation/components/providers/ActivityTracker/ActivityTrackerComponent";

const tracker = vi.hoisted(() => ({
	start: vi.fn(),
	stop: vi.fn(),
	pause: vi.fn(),
	resume: vi.fn(),
}));

vi.mock("@/infrastructure/activity/activity-tracker", () => ({ activityTracker: tracker }));

function setVisibility(state: DocumentVisibilityState) {
	Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
	document.dispatchEvent(new Event("visibilitychange"));
}

describe("ActivityTracker", () => {
	beforeEach(() => vi.clearAllMocks());

	it("tracks the visit while signed-in pages are open", () => {
		const { unmount } = render(<ActivityTracker />);
		expect(tracker.start).toHaveBeenCalled();

		setVisibility("hidden");
		expect(tracker.pause).toHaveBeenCalledTimes(1);
		setVisibility("visible");
		expect(tracker.resume).toHaveBeenCalled();
		window.dispatchEvent(new Event("pagehide"));
		expect(tracker.pause).toHaveBeenCalledTimes(2);

		unmount();
		expect(tracker.stop).toHaveBeenCalled();
		window.dispatchEvent(new Event("pagehide"));
		expect(tracker.pause).toHaveBeenCalledTimes(2);
	});
});
