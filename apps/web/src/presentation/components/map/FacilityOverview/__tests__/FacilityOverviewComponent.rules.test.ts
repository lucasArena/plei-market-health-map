import type { StatsPeriod } from "@market-health-map/core/application";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import { useFacilityOverviewRules } from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockSetMapNavigation = vi.fn();
let mockPeriod: StatsPeriod = "month";
const mockReservations = vi.fn();

vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({
		period: mockPeriod,
		setMapNavigation: mockSetMapNavigation,
	}),
}));
const mockOpenPanel = vi.fn();
vi.mock("@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent", () => ({
	useSidePanels: () => ({ openPanel: mockOpenPanel }),
}));

vi.mock("@/presentation/hooks/use-facility/use-facility-reservation-stats", () => ({
	useFacilityReservationStats: (...args: unknown[]) => mockReservations(...args),
}));

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

function renderRules(facilityId = FACILITY_DETAIL.facility.id) {
	return renderHook(
		() =>
			useFacilityOverviewRules({ facilityId, facilityName: "Pegaso HTX", marketName: "Houston" }),
		{ wrapper },
	);
}

describe("useFacilityOverviewRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPeriod = "month";
	});

	it("builds the facility header, status, scorecards, trend and popular times", () => {
		mockReservations.mockReturnValue({ data: FACILITY_DETAIL });

		const { result } = renderRules();

		expect(mockReservations).toHaveBeenCalledWith(FACILITY_DETAIL.facility.id);
		expect(result.current.header).toMatchObject({
			title: "Pegaso HTX",
			level: "Facility",
			subtitle: FACILITY_DETAIL.facility.address,
			footnote: null,
		});
		expect(result.current.sections?.status.headline).toMatch(/^Pegaso HTX: /);
		expect(result.current.sections?.status.detail).toBeNull();
		expect(result.current.sections?.scorecards.played.label).toBe("Games played");
		expect(result.current.sections?.trend.metrics).toEqual([]);
		expect(result.current.popularTimes).toMatchObject({
			title: "Popular times · last 28 days",
			dayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
		});
		expect(result.current.popularTimes?.cells).toHaveLength(28);

		act(() => result.current.header.breadcrumb[0]?.onSelect?.());
		expect(mockOpenPanel).toHaveBeenCalledWith("market-summary");
		expect(mockSetMapNavigation).toHaveBeenCalledWith({ kind: "all" });
		act(() => result.current.header.breadcrumb[1]?.onSelect?.());
		expect(mockOpenPanel).toHaveBeenCalledTimes(2);
		expect(mockSetMapNavigation).toHaveBeenCalledWith({
			kind: "market",
			id: FACILITY_DETAIL.facility.marketId,
			name: "Houston",
		});
	});

	it("waits for the facility stats before building sections", () => {
		mockReservations.mockReturnValue({ data: undefined });

		const { result } = renderRules("889");

		expect(result.current.sections).toBeNull();
		expect(result.current.popularTimes).toBeNull();
		expect(result.current.header.breadcrumb[1]?.onSelect).toBeUndefined();
		expect(result.current.header.subtitle).toBeNull();
		act(() => result.current.header.breadcrumb[0]?.onSelect?.());
		expect(mockSetMapNavigation).toHaveBeenCalledWith({ kind: "all" });
		expect(mockSetMapNavigation).toHaveBeenCalledTimes(1);
	});
});
