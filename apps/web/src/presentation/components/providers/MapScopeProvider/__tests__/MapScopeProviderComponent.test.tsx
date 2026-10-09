import { fireEvent, render, screen } from "@testing-library/react";
import { STATS_PERIOD_KEY } from "@/infrastructure/cache/local-storage/stats-period/stats-period-preference";
import {
	MapScopeProvider,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";

function Probe() {
	const { scope, setScope } = useMapScope();
	return (
		<button
			type="button"
			onClick={() => setScope({ kind: "market", id: "philly", name: "Philly" })}
		>
			{scope.kind}
		</button>
	);
}

function PeriodProbe() {
	const { period, setPeriod } = useMapScope();
	return (
		<button type="button" onClick={() => setPeriod(period === "week" ? "month" : "week")}>
			{period}
		</button>
	);
}

describe("MapScopeProvider", () => {
	beforeEach(() => localStorage.clear());

	it("remembers the chosen period for the next visit", () => {
		const { unmount } = render(
			<MapScopeProvider>
				<PeriodProbe />
			</MapScopeProvider>,
		);
		expect(screen.getByRole("button")).toHaveTextContent("week");

		fireEvent.click(screen.getByRole("button"));
		expect(localStorage.getItem(STATS_PERIOD_KEY)).toBe("month");
		unmount();

		render(
			<MapScopeProvider>
				<PeriodProbe />
			</MapScopeProvider>,
		);
		expect(screen.getByRole("button")).toHaveTextContent("month");
	});

	it("starts on all markets and shares scope changes", () => {
		render(
			<MapScopeProvider>
				<Probe />
			</MapScopeProvider>,
		);

		expect(screen.getByRole("button")).toHaveTextContent("all");
		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByRole("button")).toHaveTextContent("market");
	});

	it("falls back to all markets and ignores changes outside the provider", () => {
		render(<Probe />);

		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByRole("button")).toHaveTextContent("all");
	});
});
