import { HINT_CLASS } from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import type { StatTilesProps } from "@/presentation/components/displays/StatTiles/StatTilesComponent.types";

export function StatTiles({ tiles, testIdPrefix }: Readonly<StatTilesProps>) {
	return (
		<dl className="grid grid-cols-2 gap-2.5">
			{tiles.map((tile) => (
				<div key={tile.key} className="rounded-xl border bg-card p-3.5">
					<dt className="text-xs text-muted-foreground">{tile.label}</dt>
					{tile.isLoading ? (
						<dd
							data-testid={`${testIdPrefix}-${tile.key}-skeleton`}
							className="mt-2 h-7 w-16 animate-pulse rounded bg-muted"
						/>
					) : (
						<dd className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</dd>
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
