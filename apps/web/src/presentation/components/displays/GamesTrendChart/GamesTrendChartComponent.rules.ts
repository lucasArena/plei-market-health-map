"use client";

import { useCallback, useId, useState } from "react";
import {
	CHART_BASELINE,
	CHART_BOTTOM,
	CHART_HEIGHT,
	CHART_TOP,
	CHART_WIDTH,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.styles";
import type {
	ChartPoint,
	GamesTrendChartProps,
	GamesTrendGeometry,
	TooltipAlign,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

function point({ x, y }: ChartPoint): string {
	return `${round(x)} ${round(y)}`;
}

export function smoothPath(points: ChartPoint[]): string {
	const [first, ...rest] = points;
	if (!first) return "";
	const segments = rest.map((current, offset) => {
		const before = points[offset] ?? first;
		const beforeBefore = points[offset - 1] ?? before;
		const after = points[offset + 2] ?? current;
		const control1 = {
			x: before.x + (current.x - beforeBefore.x) / 6,
			y: before.y + (current.y - beforeBefore.y) / 6,
		};
		const control2 = {
			x: current.x - (after.x - before.x) / 6,
			y: current.y - (after.y - before.y) / 6,
		};
		return `C ${point(control1)} ${point(control2)} ${point(current)}`;
	});
	return [`M ${point(first)}`, ...segments].join(" ");
}

export function buildGeometry(values: number[], benchmark: number | null): GamesTrendGeometry {
	const domain = benchmark === null ? values : [...values, benchmark];
	const low = Math.min(...domain);
	const high = Math.max(...domain);
	const span = high - low;
	const toY = (value: number) =>
		span === 0
			? (CHART_TOP + CHART_BOTTOM) / 2
			: CHART_BOTTOM - ((value - low) / span) * (CHART_BOTTOM - CHART_TOP);
	const points = values.map((value, index) => ({
		x: ((index + 0.5) / values.length) * CHART_WIDTH,
		y: toY(value),
	}));
	const linePath = smoothPath(points);
	const first = points[0];
	const last = points.at(-1);
	const areaPath =
		first && last
			? `${linePath} L ${round(last.x)} ${CHART_BASELINE} L ${round(first.x)} ${CHART_BASELINE} Z`
			: "";
	return { linePath, areaPath, benchmarkY: benchmark === null ? null : toY(benchmark), points };
}

export function tooltipAlign(index: number, count: number): TooltipAlign {
	if (index === 0) return "start";
	if (index >= count - 2) return "end";
	return "center";
}

export function useGamesTrendChartRules({ view }: GamesTrendChartProps) {
	const gradientId = useId();
	const lastIndex = view.points.length - 1;
	const [activeIndex, setActiveIndex] = useState(lastIndex);
	const geometry = buildGeometry(
		view.points.map((item) => item.value),
		view.benchmark,
	);
	const index = Math.min(activeIndex, lastIndex);
	const active = view.points[index];
	const activePoint = geometry.points[index];

	const resetActive = useCallback(() => setActiveIndex(lastIndex), [lastIndex]);

	return {
		active,
		activePoint,
		align: tooltipAlign(index, view.points.length),
		chartHeight: CHART_HEIGHT,
		chartWidth: CHART_WIDTH,
		baselineY: CHART_BASELINE,
		geometry,
		gradientId,
		index,
		resetActive,
		setActiveIndex,
	};
}
