import {
	CLUSTER_HOVER_CHROME,
	placeClusterHoverCard,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.rules";
import type { ClusterHoverCardPlacementInput } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.types";

const GAP = 8;
const DIAMETER = 41;
const RADIUS = DIAMETER / 2;

function placement(
	cluster: { x: number; y: number },
	card: { width: number; height: number },
	viewport: { width: number; height: number } = { width: 1280, height: 800 },
) {
	const input: ClusterHoverCardPlacementInput = {
		cluster,
		card,
		viewport,
		chrome: CLUSTER_HOVER_CHROME,
		gap: GAP,
		clusterDiameter: DIAMETER,
	};
	return placeClusterHoverCard(input);
}

describe("placeClusterHoverCard", () => {
	it("keeps the card above the cluster when that side fits", () => {
		const placed = placement({ x: 640, y: 420 }, { width: 256, height: 120 });

		expect(placed.side).toBe("top");
		expect(placed.left).toBe(640);
		expect(placed.top).toBe(420 - RADIUS - GAP);
		expect(placed.transform).toBe("translate(-50%, -100%)");
	});

	it("moves a cluster near the top edge below the marker", () => {
		const placed = placement({ x: 640, y: 72 }, { width: 256, height: 220 });

		expect(placed.side).toBe("bottom");
		expect(placed.side).not.toBe("top");
		expect(placed.top).toBe(72 + RADIUS + GAP);
		expect(placed.transform).toBe("translate(-50%, 0)");
	});

	it("places the card to the right when neither vertical side fits", () => {
		const placed = placement(
			{ x: 200, y: 190 },
			{ width: 256, height: 200 },
			{ width: 1000, height: 520 },
		);

		expect(placed.side).toBe("right");
		expect(placed.left).toBe(200 + RADIUS + GAP);
		expect(placed.top).toBe(190);
		expect(placed.transform).toBe("translate(0, -50%)");
	});

	it("places the card to the left when the right side does not fit", () => {
		const placed = placement(
			{ x: 900, y: 190 },
			{ width: 256, height: 200 },
			{ width: 1000, height: 520 },
		);

		expect(placed.side).toBe("left");
		expect(placed.left).toBe(900 - RADIUS - GAP);
		expect(placed.top).toBe(190);
		expect(placed.transform).toBe("translate(-100%, -50%)");
	});

	it("places a left-edge cluster beside the marker instead of shifting the card", () => {
		const placed = placement({ x: 40, y: 420 }, { width: 256, height: 120 });

		expect(placed.side).toBe("right");
		expect(placed.left).toBe(40 + RADIUS + GAP);
		expect(placed.top).toBe(420);
		expect(placed.transform).toBe("translate(0, -50%)");
	});
});
