import {
	HINT_CLASS,
	STAT_TILE_CLASS,
	STAT_TILE_LABEL_CLASS,
	STAT_TILE_SKELETON_CLASS,
	STAT_TILE_VALUE_CLASS,
	STAT_TILES_GRID_CLASS,
} from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import type { StatTilesProps } from "@/presentation/components/displays/StatTiles/StatTilesComponent.types";

export function StatTiles({ tiles, testIdPrefix, isFlat = false }: Readonly<StatTilesProps>) {
	const variant = isFlat ? "flat" : "card";
	return (
		<dl className={STAT_TILES_GRID_CLASS[variant]}>
			{tiles.map((tile) => (
				<div key={tile.key} className={STAT_TILE_CLASS[variant]}>
					<dt className={STAT_TILE_LABEL_CLASS[variant]}>{tile.label}</dt>
					{tile.isLoading ? (
						<dd
							data-testid={`${testIdPrefix}-${tile.key}-skeleton`}
							className={STAT_TILE_SKELETON_CLASS[variant]}
						/>
					) : (
						<dd className={STAT_TILE_VALUE_CLASS[variant]}>{tile.value}</dd>
					)}
					{tile.hint && (
						<dd
							className={`mt-0.5 whitespace-nowrap text-[11px] ${HINT_CLASS[tile.hintDirection]}`}
						>
							{tile.hint}
						</dd>
					)}
				</div>
			))}
		</dl>
	);
}
