import {
	SWATCH_RING,
	SWATCH_TIP,
	useTrendSwatchRules,
} from "@/presentation/components/displays/TrendSwatch/TrendSwatchComponent.rules";
import type { TrendSwatchProps } from "@/presentation/components/displays/TrendSwatch/TrendSwatchComponent.types";

export function TrendSwatch({ level, className = "size-[18px]" }: Readonly<TrendSwatchProps>) {
	const { color, maskId, ringRadius, rotation } = useTrendSwatchRules(level);
	return (
		<svg
			viewBox="-13 -13 26 26"
			aria-hidden="true"
			data-testid={`trend-swatch-${level}`}
			className={`shrink-0 overflow-visible ${className}`}
		>
			<circle r={SWATCH_RING.outer + 1} fill="rgba(255,255,255,0.7)" stroke="rgba(15,23,42,0.08)" />
			<circle
				r={ringRadius}
				fill="none"
				stroke={color}
				strokeWidth={SWATCH_RING.outer - SWATCH_RING.inner}
			/>
			{
				<>
					<mask id={maskId}>
						<rect x="-13" y="-13" width="26" height="26" fill="#fff" />
						<circle r={SWATCH_RING.inner} fill="#000" />
					</mask>
					<polygon
						data-testid={`trend-swatch-tip-${level}`}
						points={SWATCH_TIP}
						fill={color}
						mask={`url(#${maskId})`}
						transform={`rotate(${rotation})`}
					/>
				</>
			}
		</svg>
	);
}
