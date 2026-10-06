import {
	CLUSTER_TREND_RING,
	CLUSTER_TREND_TIP,
	FACILITY_TREND_RING,
	FACILITY_TREND_TIP,
	TREND_TIP_LENGTH,
	type TrendRing,
	type TrendTipShape,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

function points(path: string) {
	return [...path.matchAll(/(?:M|L|0 1 [01]) ([\d.]+) ([\d.]+)/g)].map(([, x, y]) => [
		Number(x),
		Number(y),
	]);
}

describe("games trend ring and tip", () => {
	it("uses the same larger ring for clusters and individual game facilities", () => {
		expect(CLUSTER_TREND_RING).toEqual({ disc: 45, outer: 21.5, inner: 19.5 });
		expect(FACILITY_TREND_RING).toEqual({ disc: 45, outer: 21.5, inner: 19.5 });
		expect(TREND_TIP_LENGTH).toBe(5);
		expect(CLUSTER_TREND_TIP).toMatchObject({ apex: 27.5, box: 58, inner: 19.5 });
		expect(FACILITY_TREND_TIP).toMatchObject({ apex: 27.5, box: 58, inner: 19.5 });
	});

	it.each([
		["cluster", CLUSTER_TREND_RING, CLUSTER_TREND_TIP],
		["games facility", FACILITY_TREND_RING, FACILITY_TREND_TIP],
	] as const)("draws the %s ring and tip as one shape joined along tangents", (_, ring, tip) => {
		const shape = tip as TrendTipShape;
		const circle = ring as TrendRing;
		const center = shape.box / 2;
		for (const [path, direction] of [
			[shape.down, 1],
			[shape.up, -1],
		] as const) {
			expect(path).toMatch(/^path\(evenodd, "/);
			const [right, left, apex, hole] = points(path);
			expect(apex).toEqual([center, center + direction * shape.apex]);
			expect(hole).toEqual([center + circle.inner, center]);
			for (const point of [right, left]) {
				const [x = 0, y = 0] = point ?? [];
				const radius = Math.hypot(x - center, y - center);
				expect(radius).toBeCloseTo(circle.outer, 1);
				const toApex = [center - x, center + direction * shape.apex - y];
				const fromCenter = [x - center, y - center];
				const dot =
					(toApex[0] ?? 0) * (fromCenter[0] ?? 0) + (toApex[1] ?? 0) * (fromCenter[1] ?? 0);
				expect(Math.abs(dot) / (radius * Math.hypot(toApex[0] ?? 0, toApex[1] ?? 0))).toBeLessThan(
					0.01,
				);
				expect(Math.sign(y - center)).toBe(direction);
			}
		}
		expect(shape.down).toContain(" 0 1 0 ");
		expect(shape.up).toContain(" 0 1 1 ");
		expect(shape.stable).toBe(shape.down);
	});
});
