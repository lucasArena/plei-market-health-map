import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	buildFeatureFlagRows,
	useFeatureFlagsScreenRules,
} from "@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent.rules";

const mockFlags = vi.fn();
const mockMutate = vi.fn();
const mockMutation = vi.fn();

vi.mock("@/presentation/hooks/use-feature-flags/use-admin-feature-flags", () => ({
	useAdminFeatureFlags: () => mockFlags(),
	useSetFeatureFlag: () => mockMutation(),
}));

const messages = {
	...EN_MESSAGES.featureFlags,
	descriptions: { "new-panel": "Shows the new market panel" },
};
const formatters = createDetailFormatters("en");
const FLAGS = [
	{
		key: "new-panel",
		enabled: true,
		updatedBy: "stefano@plei.com",
		updatedAt: "2026-10-01T15:00:00.000Z",
	},
	{ key: "demographic-filters", enabled: false, updatedBy: null, updatedAt: null },
];

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("buildFeatureFlagRows", () => {
	it("labels each flag with its description, state, switch label and last change", () => {
		expect(buildFeatureFlagRows(FLAGS, messages, formatters)).toEqual([
			{
				key: "new-panel",
				description: "Shows the new market panel",
				enabled: true,
				state: "on",
				statusLabel: "On",
				toggleLabel: "Turn new-panel off",
				lastChange: "stefano@plei.com · Oct 1, 2026",
			},
			{
				key: "demographic-filters",
				description: "",
				enabled: false,
				state: "off",
				statusLabel: "Off",
				toggleLabel: "Turn demographic-filters on",
				lastChange: "Never switched",
			},
		]);
	});
});

describe("useFeatureFlagsScreenRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMutation.mockReturnValue({ mutate: mockMutate, isPending: false, variables: undefined });
	});

	it("is loading, then ready with one row per flag", () => {
		mockFlags.mockReturnValue({ data: undefined, isPending: true, isError: false });
		const { result, rerender } = renderHook(() => useFeatureFlagsScreenRules(), { wrapper });
		expect(result.current.status).toBe("loading");
		expect(result.current.rows).toEqual([]);

		mockFlags.mockReturnValue({ data: FLAGS, isPending: false, isError: false });
		rerender();
		expect(result.current.status).toBe("ready");
		expect(result.current.rows.map((row) => row.key)).toEqual(["new-panel", "demographic-filters"]);
		expect(result.current.backToMapLabel).toBe("Back to the map");
	});

	it("flips a flag and shows an error when the switch fails", () => {
		mockFlags.mockReturnValue({ data: FLAGS, isPending: false, isError: false });
		const { result } = renderHook(() => useFeatureFlagsScreenRules(), { wrapper });

		act(() => result.current.toggle(result.current.rows[0] as never));
		expect(mockMutate).toHaveBeenCalledWith(
			{ key: "new-panel", enabled: false },
			expect.objectContaining({ onError: expect.any(Function) }),
		);
		expect(result.current.errorMessage).toBeNull();

		act(() => mockMutate.mock.calls[0]?.[1].onError());
		expect(result.current.errorMessage).toBe("We couldn't switch new-panel. Please try again.");
	});

	it("reports which flag is being switched", () => {
		mockFlags.mockReturnValue({ data: FLAGS, isPending: false, isError: false });
		mockMutation.mockReturnValue({
			mutate: mockMutate,
			isPending: true,
			variables: { key: "new-panel", enabled: false },
		});
		const { result, rerender } = renderHook(() => useFeatureFlagsScreenRules(), { wrapper });
		expect(result.current.pendingKey).toBe("new-panel");

		mockMutation.mockReturnValue({ mutate: mockMutate, isPending: true, variables: undefined });
		rerender();
		expect(result.current.pendingKey).toBeNull();
	});
});
