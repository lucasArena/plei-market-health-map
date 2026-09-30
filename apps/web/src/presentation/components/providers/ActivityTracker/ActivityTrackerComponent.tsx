"use client";

import { useActivityTrackerRules } from "@/presentation/components/providers/ActivityTracker/ActivityTrackerComponent.rules";

export function ActivityTracker() {
	useActivityTrackerRules();
	return null;
}
