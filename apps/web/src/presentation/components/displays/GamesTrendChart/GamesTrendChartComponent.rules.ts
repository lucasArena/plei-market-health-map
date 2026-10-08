"use client";

import { useCallback, useId, useState } from "react";
import {
	AXIS_LABEL_CHAR_WIDTH,
	AXIS_LABEL_PADDING,
	AXIS_ZERO_LABEL,
	CHART_AXIS,
	CHART_BASELINE,
	CHART_HEIGHT,
	CHART_WIDTH,
	HAIRLINE_TOP,
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

export function niceAxisMax(values: number[]): number | null {
	const high = Math.max(0, ...values);
	if (high <= 0) return null;
	const step = Math.max(1, 10 ** Math.floor(Math.log10(high)) / 2);
	return Math.ceil(high / step) * step;
}

export function buildGeometry(values: number[], axisMax: number | null): GamesTrendGeometry {
	const high = axisMax ?? Math.max(0, ...values);
	const toY = (value: number) =>
		high <= 0 ? CHART_BASELINE : CHART_BASELINE - (value / high) * (CHART_BASELINE - CHART_AXIS);
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
	return { linePath, areaPath, axisY: axisMax === null ? null : CHART_AXIS, points };
}

export function axisLineStart(label: string | null): number {
	return label ? label.length * AXIS_LABEL_CHAR_WIDTH + AXIS_LABEL_PADDING : 0;
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
		view.axisMax,
	);
	const index = Math.min(activeIndex, lastIndex);
	const active = view.points[index];
	const activePoint = geometry.points[index];

	const resetActive = useCallback(() => setActiveIndex(lastIndex), [lastIndex]);

	return {
		active,
		activePoint,
		align: tooltipAlign(index, view.points.length),
		axisStart: axisLineStart(view.axisLabel),
		baselineStart: axisLineStart(AXIS_ZERO_LABEL),
		zeroLabel: AXIS_ZERO_LABEL,
		chartHeight: CHART_HEIGHT,
		chartWidth: CHART_WIDTH,
		baselineY: CHART_BASELINE,
		geometry,
		gradientId,
		hairlineTop: HAIRLINE_TOP,
		index,
		resetActive,
		setActiveIndex,
	};
}
