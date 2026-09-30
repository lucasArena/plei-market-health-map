"use client";

import { useEffect } from "react";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";

export function useActivityTrackerRules() {
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") activityTracker.pause();
			else activityTracker.resume();
		};
		const handlePageHide = () => activityTracker.pause();
		activityTracker.start();
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("pagehide", handlePageHide);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("pagehide", handlePageHide);
			activityTracker.stop();
		};
	}, []);
}
