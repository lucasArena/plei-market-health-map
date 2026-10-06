import { type GamesTrend, gamesTrend } from "@market-health-map/core/domain";
import { getMessages } from "@market-health-map/core/i18n";
import { render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { FacilityHoverCard } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent";
import {
	clusterHoverCardHeight,
	clusterLabels,
	FACILITY_HOVER_TREND_HEIGHT,
	facilityHoverCardHeight,
	facilityTrendLine,
	formatGamesChange,
	formatGamesCount,
	formatGamesTrend,
	HOVER_TREND_LINE_HEIGHT,
	trendWindowDays,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.rules";

const mockPeriod = vi.hoisted(() => vi.fn(() => "month"));

vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({ period: mockPeriod() }),
}));

beforeEach(() => {
	mockPeriod.mockReturnValue("month");
});

const TREND = EN_MESSAGES.map.trend;

const POINT = {
	id: "f1",
	marketId: "austin",
	marketName: "Austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	isActive: true,
	isActiveLastWeek: true,
	location: { latitude: 30.27, longitude: -97.74 },
};

const VIEWPORT = { width: 1280, height: 800 };
const PLACEMENT = { x: 640, y: 420, flipX: false, flipY: false, viewport: VIEWPORT };

function facilityHover(trend?: GamesTrend, games?: number) {
	return {
		kind: "facility" as const,
		facility: POINT,
		...PLACEMENT,
		...(games === undefined ? {} : { games }),
		...(trend ? { trend } : {}),
	};
}

function clusterHover(trend?: GamesTrend, games?: number, facilities = [POINT]) {
	return {
		kind: "cluster" as const,
		clusterId: 7,
		total: 18,
		facilities,
		...PLACEMENT,
		...(games === undefined ? {} : { games }),
		...(trend ? { trend } : {}),
	};
}

const games = (current: number, previous: number) => gamesTrend(current, previous);

describe("hover trend copy", () => {
	it("describes games by the change in games over the window", () => {
		expect(formatGamesTrend(gamesTrend(42, 51), TREND)).toBe(
			"42 games, down 9 from the previous 28 days",
		);
		expect(formatGamesTrend(gamesTrend(6, 0), TREND)).toBe(
			"6 games, up 6 from the previous 28 days",
		);
		expect(formatGamesTrend(gamesTrend(42, 41), TREND)).toBe(
			"42 games, up 1 from the previous 28 days",
		);
		expect(formatGamesTrend(gamesTrend(1, 1), TREND)).toBe(
			"1 game, unchanged from the past 28 days",
		);
		expect(formatGamesChange(gamesTrend(41, 42), TREND)).toBe("Down 1 from the previous 28 days");
		expect(formatGamesChange(gamesTrend(42, 42), TREND, 7)).toBe("Unchanged from the past 7 days");
		expect(formatGamesChange(gamesTrend(42, 42), TREND)).toBe("Unchanged from the past 28 days");
		expect(formatGamesTrend(gamesTrend(42, 51), TREND, 7)).toBe(
			"42 games, down 9 from the previous 7 days",
		);
	});

	it.each(["en", "pt-BR", "es"] as const)("writes %s trend copy without dashes", (locale) => {
		const copy = Object.values(getMessages(locale).map.trend).join("\n");
		expect(copy).not.toMatch(/[\u2013\u2014]| - /);
	});
});

describe("hover card trend line", () => {
	it("shows only the games line under a facility name with Games selected", () => {
		render(
			<FacilityHoverCard hover={facilityHover(games(42, 51), 42)} messages={EN_MESSAGES.map} />,
		);

		expect(screen.getByText("Eastside Futsal Arena")).toBeInTheDocument();
		expect(screen.getByTestId("facility-hover-trend")).toHaveTextContent(
			"42 games, down 9 from the previous 28 days",
		);
		expect(screen.queryByTestId(/trend-swatch/)).not.toBeInTheDocument();
	});

	it("keeps the facility hover unchanged while trend is off", () => {
		render(<FacilityHoverCard hover={facilityHover()} messages={EN_MESSAGES.map} />);

		expect(screen.queryByTestId("facility-hover-trend")).not.toBeInTheDocument();
	});

	it("heads a Games cluster with its games count and puts the change right under it", () => {
		render(
			<FacilityHoverCard hover={clusterHover(games(130, 100), 130)} messages={EN_MESSAGES.map} />,
		);

		expect(screen.getByText("130 games")).toBeInTheDocument();
		expect(screen.getAllByTestId("cluster-hover-trend")).toHaveLength(1);
		expect(screen.getByTestId("cluster-hover-trend")).toHaveTextContent(
			"Up 30 from the previous 28 days",
		);
		expect(screen.getAllByText(/games/)).toHaveLength(1);
		expect(screen.queryByText(/facilit/)).not.toBeInTheDocument();
		expect(screen.getByText("Eastside Futsal Arena")).toBeInTheDocument();
	});

	it("shows only the games count in Games mode with trend off, and no facility count", () => {
		const listed = [POINT, { ...POINT, id: "f2", name: "Westside Courts" }];
		render(
			<FacilityHoverCard hover={clusterHover(undefined, 46, listed)} messages={EN_MESSAGES.map} />,
		);

		expect(screen.getByText("46 games")).toBeInTheDocument();
		expect(screen.queryByTestId("cluster-hover-trend")).not.toBeInTheDocument();
		expect(screen.queryByText(/facilities|more/)).not.toBeInTheDocument();
		expect(screen.getByText("Westside Courts")).toBeInTheDocument();
	});

	it("shows the facility's games count, then the count with its change while trend is on", () => {
		const { rerender } = render(
			<FacilityHoverCard hover={facilityHover(undefined, 1)} messages={EN_MESSAGES.map} />,
		);
		expect(screen.getByTestId("facility-hover-trend")).toHaveTextContent(/^1 game$/);

		rerender(
			<FacilityHoverCard hover={facilityHover(games(6, 0), 6)} messages={EN_MESSAGES.map} />,
		);
		expect(screen.getByTestId("facility-hover-trend")).toHaveTextContent(
			/^6 games, up 6 from the previous 28 days$/,
		);
		expect(screen.getAllByText(/games/)).toHaveLength(1);
	});

	it("keeps the cluster heading as a plain count while trend is off", () => {
		render(<FacilityHoverCard hover={clusterHover()} messages={EN_MESSAGES.map} />);

		expect(screen.getByText("18 facilities")).toBeInTheDocument();
		expect(screen.queryByTestId("cluster-hover-trend")).not.toBeInTheDocument();
	});

	it("adds a trend line only to Games mode hovers", () => {
		expect(clusterLabels(clusterHover(games(100, 97)), EN_MESSAGES.map)).toMatchObject({
			title: "18 facilities",
			trend: null,
		});
		expect(facilityTrendLine(null, EN_MESSAGES.map)).toBeNull();
		expect(facilityTrendLine(clusterHover(games(1, 1)), EN_MESSAGES.map)).toBeNull();
		expect(facilityTrendLine(facilityHover(games(6, 0)), EN_MESSAGES.map)).toBeNull();
		expect(facilityTrendLine(facilityHover(games(6, 0), 6), EN_MESSAGES.map)).toBe(
			"6 games, up 6 from the previous 28 days",
		);
	});

	it("reads the games change alone in pt-BR and es, without dashes", () => {
		expect(formatGamesChange(gamesTrend(46, 52), getMessages("pt-BR").map.trend)).toBe(
			"6 a menos que nos 28 dias anteriores",
		);
		expect(formatGamesChange(gamesTrend(46, 46), getMessages("es").map.trend)).toBe(
			"Sin cambios respecto a los últimos 28 días",
		);
		expect(formatGamesChange(gamesTrend(60, 46), TREND)).toBe("Up 14 from the previous 28 days");
		expect(formatGamesCount(1, TREND)).toBe("1 game");
	});

	it("names the selected period's window in the hover copy", () => {
		mockPeriod.mockReturnValue("week");
		const { rerender } = render(
			<FacilityHoverCard hover={facilityHover(games(42, 51), 42)} messages={EN_MESSAGES.map} />,
		);
		expect(screen.getByTestId("facility-hover-trend")).toHaveTextContent(
			"42 games, down 9 from the previous 7 days",
		);

		rerender(
			<FacilityHoverCard hover={clusterHover(games(130, 100), 130)} messages={EN_MESSAGES.map} />,
		);
		expect(screen.getByTestId("cluster-hover-trend")).toHaveTextContent(
			"Up 30 from the previous 7 days",
		);
		expect(trendWindowDays("month")).toBe(28);
	});

	it("reserves room for the trend line when placing the card", () => {
		expect(facilityHoverCardHeight(true) - facilityHoverCardHeight()).toBe(
			FACILITY_HOVER_TREND_HEIGHT,
		);
		expect(facilityHoverCardHeight(false, true) - facilityHoverCardHeight()).toBe(
			HOVER_TREND_LINE_HEIGHT,
		);
		expect(clusterHoverCardHeight(0, false, true) - clusterHoverCardHeight(0, false)).toBe(
			HOVER_TREND_LINE_HEIGHT,
		);
	});
});
