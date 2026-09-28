import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagesProvider } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	buildFacilityRows,
	buildHeader,
	buildIndicators,
	resolveDetailStatus,
	useMarketDetailPanelRules,
} from "@/components/markets/MarketDetailPanel/MarketDetailPanelComponent.rules";
import { EN_MESSAGES } from "@/test/messages";

const mockUseMarketDetail = vi.fn();

vi.mock("@/lib/api/use-market-detail", () => ({
	useMarketDetail: (marketId: string) => mockUseMarketDetail(marketId),
}));

const DETAIL = {
	market: {
		id: "sample-tampa",
		name: "Tampa",
		state: "Florida",
		country: "USA",
		currency: "USD",
		location: { latitude: 27.95, longitude: -82.46 },
		metrics: { activePlayers: 1300, gamesLastWeek: 150, facilities: 2, healthScore: 37 },
		healthStatus: "at-risk" as const,
	},
	facilities: [
		{
			id: "f1",
			marketId: "sample-tampa",
			name: "Harbor Sports Dome",
			address: "120 Main St, Tampa, FL",
			avatarUrl: null,
			metrics: { activePlayers: 1200, gamesLastWeek: 90, utilization: 81 },
		},
	],
};

const numberFormat = new Intl.NumberFormat("en");

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("market detail builders", () => {
	it("builds a header with a localized status", () => {
		expect(buildHeader(DETAIL, EN_MESSAGES)).toEqual({
			title: "Tampa",
			subtitle: "Florida · USA",
			statusLabel: "At risk",
			statusColor: "#dc2626",
			healthStatus: "at-risk",
		});
	});

	it("builds the four indicators", () => {
		expect(buildIndicators(DETAIL, EN_MESSAGES, numberFormat)).toEqual([
			{ key: "healthScore", label: "Health score", value: "37", suffix: "/100" },
			{ key: "activePlayers", label: "Active players", value: "1,300" },
			{ key: "gamesLastWeek", label: "Games last week", value: "150" },
			{ key: "facilities", label: "Facilities", value: "2" },
		]);
	});

	it("formats facility rows", () => {
		expect(buildFacilityRows(DETAIL, EN_MESSAGES, numberFormat)[0]).toMatchObject({
			playersLabel: "1,200 players",
			gamesLabel: "90 games/wk",
			utilizationLabel: "81% utilization",
		});
	});

	it("resolves the panel status", () => {
		expect(resolveDetailStatus(true, false)).toBe("loading");
		expect(resolveDetailStatus(false, true)).toBe("error");
		expect(resolveDetailStatus(false, false)).toBe("ready");
	});
});

describe("useMarketDetailPanelRules", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns the view for the selected market", () => {
		mockUseMarketDetail.mockReturnValue({ data: DETAIL, isPending: false, isError: false });

		const { result } = renderHook(
			() => useMarketDetailPanelRules({ marketId: "sample-tampa", onClose: vi.fn() }),
			{ wrapper },
		);

		expect(mockUseMarketDetail).toHaveBeenCalledWith("sample-tampa");
		expect(result.current.status).toBe("ready");
		expect(result.current.view?.facilitiesCountLabel).toBe("1 facilities");
		expect(result.current.view?.facilities).toHaveLength(1);
	});

	it("has no view while loading", () => {
		mockUseMarketDetail.mockReturnValue({ data: undefined, isPending: true, isError: false });

		const { result } = renderHook(
			() => useMarketDetailPanelRules({ marketId: "sample-tampa", onClose: vi.fn() }),
			{ wrapper },
		);

		expect(result.current.status).toBe("loading");
		expect(result.current.view).toBeNull();
	});

	it("closes on Escape only", () => {
		mockUseMarketDetail.mockReturnValue({ data: DETAIL, isPending: false, isError: false });
		const onClose = vi.fn();
		const { unmount } = renderHook(
			() => useMarketDetailPanelRules({ marketId: "sample-tampa", onClose }),
			{ wrapper },
		);

		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		});
		unmount();
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
