import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { FacilityHoverCard } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent";
import {
	clusterHoverListMaxHeight,
	clusterHoverMotionClass,
	clusterListShowsBottomFade,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.rules";
import { REVEAL_MOTION_MS } from "@/presentation/hooks/use-map/use-reveal-motion";
import {
	CLUSTER_HOVER_GAP,
	CLUSTER_OUTER_DIAMETER,
	FACILITY_GLASS_DIAMETER,
	HOVER_CARD_WIDTH,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

function facility(id: string, name: string) {
	return {
		id,
		marketId: "austin",
		marketName: "Austin",
		name,
		avatarUrl: null,
		isActive: true,
		isActiveLastWeek: true,
		location: { latitude: 30.27, longitude: -97.74 },
	};
}

const FACILITIES = [facility("f1", "Eastside Futsal Arena"), facility("f2", "Harbor Sports Dome")];

const VIEWPORT = { width: 1280, height: 800 };

function clusterHover(clusterId: number, x: number, total = 12, y = 420) {
	return {
		kind: "cluster" as const,
		clusterId,
		total,
		facilities: FACILITIES,
		x,
		y,
		flipX: false,
		flipY: false,
		viewport: VIEWPORT,
	};
}

describe("FacilityHoverCard", () => {
	it("renders nothing while the pointer is not over a facility or cluster", () => {
		render(<FacilityHoverCard hover={null} messages={EN_MESSAGES.map} />);

		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	});

	it("shows one facility in the same glass card, centered 8px above the dot", () => {
		const point = FACILITIES[0] ?? facility("x", "x");
		const onFacilitySelect = vi.fn();
		const onClusterPointerEnter = vi.fn();
		const onClusterPointerLeave = vi.fn();
		const center = { x: 640, y: 420 };
		const top = center.y - FACILITY_GLASS_DIAMETER / 2 - CLUSTER_HOVER_GAP;

		render(
			<FacilityHoverCard
				hover={{
					kind: "facility",
					facility: point,
					x: center.x,
					y: center.y,
					flipX: false,
					flipY: false,
					viewport: VIEWPORT,
				}}
				messages={EN_MESSAGES.map}
				onClusterPointerEnter={onClusterPointerEnter}
				onClusterPointerLeave={onClusterPointerLeave}
				onFacilitySelect={onFacilitySelect}
			/>,
		);

		const card = screen.getByRole("tooltip");
		expect(card).toHaveStyle({
			left: `${center.x}px`,
			top: `${top}px`,
			width: `${HOVER_CARD_WIDTH}px`,
			transform: "translate(-50%, -100%)",
		});
		expect(card).toHaveClass("pointer-events-auto");
		const surface = screen.getByTestId("cluster-hover-surface");
		expect(surface).toHaveClass(
			"map-glass",
			"shadow-[var(--map-shadow)]",
			"rounded-[var(--map-radius)]",
			"py-1.5",
			"cluster-hover-in",
		);
		expect(surface).not.toHaveClass("pt-2");
		expect(screen.getByText("EF")).toHaveAttribute("data-appearance", "muted");
		expect(screen.getByText("EF")).not.toHaveClass("border-2", "border-pleiful-pitch-green-80");
		expect(screen.getByText("Eastside Futsal Arena")).toHaveClass("text-[14px]", "text-foreground");
		expect(screen.queryByText(/facilities/)).not.toBeInTheDocument();
		expect(screen.queryByTestId("cluster-hover-list")).not.toBeInTheDocument();

		fireEvent.pointerEnter(card);
		expect(onClusterPointerEnter).toHaveBeenCalledTimes(1);
		fireEvent.pointerLeave(card);
		expect(onClusterPointerLeave).toHaveBeenCalledTimes(1);
		fireEvent.click(screen.getByRole("button", { name: /Eastside Futsal Arena/ }));
		expect(onFacilitySelect).toHaveBeenCalledWith(point);
	});

	it("places a facility card below the dot when the centered card would clip the header", () => {
		render(
			<FacilityHoverCard
				hover={{
					kind: "facility",
					facility: FACILITIES[0] ?? facility("x", "x"),
					x: 640,
					y: 72,
					flipX: false,
					flipY: false,
					viewport: VIEWPORT,
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.getByRole("tooltip")).toHaveStyle({
			transform: "translate(-50%, 0)",
			top: `${72 + FACILITY_GLASS_DIAMETER / 2 + CLUSTER_HOVER_GAP}px`,
		});
	});

	it("places a facility card to the right when a centered card would leave the map", () => {
		render(
			<FacilityHoverCard
				hover={{
					kind: "facility",
					facility: FACILITIES[0] ?? facility("x", "x"),
					x: 40,
					y: 420,
					flipX: false,
					flipY: false,
					viewport: VIEWPORT,
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.getByRole("tooltip")).toHaveStyle({
			left: `${40 + FACILITY_GLASS_DIAMETER / 2 + CLUSTER_HOVER_GAP}px`,
			top: "420px",
			transform: "translate(0, -50%)",
		});
	});

	it("anchors the cluster card 8px above the cluster and centers it", () => {
		const center = { x: 640, y: 420 };
		const top = center.y - CLUSTER_OUTER_DIAMETER / 2 - CLUSTER_HOVER_GAP;

		render(
			<FacilityHoverCard
				hover={clusterHover(7, center.x, 12, center.y)}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(CLUSTER_HOVER_GAP).toBe(8);
		expect(top).toBe(center.y - CLUSTER_OUTER_DIAMETER / 2 - 8);
		expect(screen.getByRole("tooltip")).toHaveStyle({
			left: `${center.x}px`,
			top: `${top}px`,
			width: `${HOVER_CARD_WIDTH}px`,
			transform: "translate(-50%, -100%)",
		});
		expect(screen.getByTestId("cluster-hover-surface")).toHaveClass(
			"map-glass",
			"shadow-[var(--map-shadow)]",
			"rounded-[var(--map-radius)]",
		);
	});

	it("places a cluster near the top of the map below the marker", () => {
		render(<FacilityHoverCard hover={clusterHover(7, 640, 12, 72)} messages={EN_MESSAGES.map} />);

		expect(screen.getByRole("tooltip")).toHaveStyle({
			transform: "translate(-50%, 0)",
			top: `${72 + CLUSTER_OUTER_DIAMETER / 2 + CLUSTER_HOVER_GAP}px`,
		});
		expect(screen.getByRole("tooltip")).not.toHaveStyle({
			transform: "translate(-50%, -100%)",
		});
	});

	it("lists cluster facilities from A to Z", () => {
		render(
			<FacilityHoverCard
				hover={{
					...clusterHover(7, 640, 3),
					facilities: [
						facility("c", "SoFive Upland"),
						facility("a", "beta Court"),
						facility("b", "AV Indoor Soccer Center"),
					],
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		const buttons = screen.getAllByRole("button");
		expect(buttons[0]).toHaveTextContent("AV Indoor Soccer Center");
		expect(buttons[1]).toHaveTextContent("beta Court");
		expect(buttons[2]).toHaveTextContent("SoFive Upland");
	});

	it("lists the facilities gathered in a cluster with a remainder", () => {
		render(<FacilityHoverCard hover={clusterHover(7, 640)} messages={EN_MESSAGES.map} />);

		expect(screen.getByText("12 facilities")).toHaveClass(
			"text-[12px]",
			"font-medium",
			"text-muted-foreground",
		);
		expect(screen.getByTestId("cluster-hover-divider")).toHaveClass("bg-black/8");
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
		expect(screen.getAllByText("EF")[0]).toHaveAttribute("data-appearance", "muted");
		expect(screen.getByText("Harbor Sports Dome")).toHaveClass("text-[14px]", "text-foreground");
		expect(screen.getByText("+10 more")).toHaveClass("text-[12px]", "font-medium");
	});

	it("shows only the count while the cluster's facilities load", () => {
		render(
			<FacilityHoverCard
				hover={{ ...clusterHover(7, 640), facilities: [] }}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.getByText("12 facilities")).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
		expect(screen.queryByText(/more/)).not.toBeInTheDocument();
	});

	it("stays open when the pointer moves onto the card", () => {
		const onClusterPointerEnter = vi.fn();
		const onClusterPointerLeave = vi.fn();
		render(
			<FacilityHoverCard
				hover={clusterHover(7, 640)}
				messages={EN_MESSAGES.map}
				onClusterPointerEnter={onClusterPointerEnter}
				onClusterPointerLeave={onClusterPointerLeave}
			/>,
		);

		const card = screen.getByRole("tooltip");
		fireEvent.pointerEnter(card);
		expect(onClusterPointerEnter).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("tooltip")).toBeInTheDocument();
		fireEvent.pointerLeave(card);
		expect(onClusterPointerLeave).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("tooltip")).toBeInTheDocument();
		expect(card).toHaveClass("pointer-events-auto");
	});

	it("scrolls the full facility list once it passes eight rows", () => {
		const facilities = Array.from({ length: 9 }, (_, index) =>
			facility(`f${index}`, `Facility ${index}`),
		);
		render(
			<FacilityHoverCard
				hover={{ ...clusterHover(7, 640, 9), facilities }}
				messages={EN_MESSAGES.map}
			/>,
		);

		const list = screen.getByTestId("cluster-hover-list");
		const scrollCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
		const scrollRule = scrollCss.slice(
			scrollCss.indexOf(".cluster-hover-scroll {"),
			scrollCss.indexOf("@media (prefers-reduced-motion: reduce)"),
		);
		expect(list).toHaveClass("overflow-y-auto", "cluster-hover-scroll", "py-1.5");
		expect(list).not.toHaveClass("pb-2", "pt-2");
		expect(screen.getByTestId("cluster-hover-surface")).toHaveClass("pt-2");
		expect(screen.getByTestId("cluster-hover-surface")).not.toHaveClass("py-2", "pb-2");
		expect(scrollRule).toContain("scrollbar-color: rgb(55 65 81 / 0.45) transparent;");
		expect(scrollRule).toContain("background: transparent;");
		expect(scrollRule).not.toContain("background: white");
		expect(scrollRule).toContain("background: rgb(55 65 81 / 0.45);");
		expect(clusterHoverListMaxHeight()).toBe(270);
		expect(list).toHaveStyle({ maxHeight: "270px" });
		expect(screen.getAllByRole("button")).toHaveLength(9);
		expect(screen.getAllByRole("button")[0]).toHaveClass(
			"hover:bg-foreground/[0.07]",
			"focus:bg-foreground/[0.07]",
		);
		expect(screen.queryByText(/more/)).not.toBeInTheDocument();
	});

	it("fades the bottom of the list until the last row is fully in view", () => {
		expect(clusterListShowsBottomFade(0, 200, 400)).toBe(true);
		expect(clusterListShowsBottomFade(200, 200, 400)).toBe(false);
		expect(clusterListShowsBottomFade(0, 200, 180)).toBe(false);

		const facilities = Array.from({ length: 9 }, (_, index) =>
			facility(`f${index}`, `Facility ${index}`),
		);
		render(
			<FacilityHoverCard
				hover={{ ...clusterHover(7, 640, 9), facilities }}
				messages={EN_MESSAGES.map}
			/>,
		);
		const list = screen.getByTestId("cluster-hover-list");
		const scrollCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
		const fadeRule = scrollCss.slice(
			scrollCss.indexOf(".cluster-hover-list-fade {"),
			scrollCss.indexOf("@media (prefers-reduced-motion: reduce)"),
		);
		expect(fadeRule).toContain(
			"mask-image: linear-gradient(to bottom, #000 calc(100% - 20px), transparent);",
		);
		expect(fadeRule).not.toContain("white");
		expect(list).not.toHaveClass("cluster-hover-list-fade");

		Object.defineProperty(list, "scrollHeight", { configurable: true, value: 400 });
		Object.defineProperty(list, "clientHeight", { configurable: true, value: 200 });
		Object.defineProperty(list, "scrollTop", { configurable: true, value: 0 });
		fireEvent.scroll(list);
		expect(list).toHaveClass("cluster-hover-list-fade");

		Object.defineProperty(list, "scrollTop", { configurable: true, value: 200 });
		fireEvent.scroll(list);
		expect(list).not.toHaveClass("cluster-hover-list-fade");
	});

	it("leaves cluster facility avatars without a pitch-green stroke", () => {
		render(
			<FacilityHoverCard
				hover={{
					...clusterHover(7, 640, 2),
					facilities: [
						facility("a", "Active Dome"),
						{ ...facility("b", "Quiet Dome"), isActive: false, isActiveLastWeek: false },
					],
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.getByText("AD")).toHaveClass("border-0");
		expect(screen.getByText("AD")).not.toHaveClass("border-2", "border-pleiful-pitch-green-80");
		expect(screen.getByText("QD")).toHaveClass("border-0");
		expect(screen.getByText("QD")).not.toHaveClass("border-2", "border-pleiful-pitch-green-80");
	});

	it("selects a facility when its row is clicked", () => {
		const onFacilitySelect = vi.fn();
		render(
			<FacilityHoverCard
				hover={clusterHover(7, 640, 2)}
				messages={EN_MESSAGES.map}
				onFacilitySelect={onFacilitySelect}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Harbor Sports Dome/ }));
		expect(onFacilitySelect).toHaveBeenCalledWith(expect.objectContaining({ id: "f2" }));
	});

	it("omits the remainder when every facility is listed", () => {
		render(<FacilityHoverCard hover={clusterHover(7, 640, 2)} messages={EN_MESSAGES.map} />);

		expect(screen.queryByText(/more/)).not.toBeInTheDocument();
	});

	it("eases the cluster card in and out, and retargets another cluster without replaying", () => {
		vi.useFakeTimers();
		try {
			const { rerender } = render(
				<FacilityHoverCard hover={clusterHover(7, 10)} messages={EN_MESSAGES.map} />,
			);
			expect(screen.getByTestId("cluster-hover-surface")).toHaveClass("cluster-hover-in");

			act(() => {
				vi.advanceTimersByTime(REVEAL_MOTION_MS.enter);
			});
			expect(screen.getByTestId("cluster-hover-surface")).not.toHaveClass("cluster-hover-in");

			rerender(<FacilityHoverCard hover={clusterHover(8, 520, 4)} messages={EN_MESSAGES.map} />);
			expect(screen.getByTestId("cluster-hover-surface")).not.toHaveClass("cluster-hover-in");
			expect(screen.getByTestId("cluster-hover-surface")).not.toHaveClass("cluster-hover-out");
			expect(screen.getByRole("tooltip")).toHaveStyle({ left: "520px" });
			expect(screen.getByText("4 facilities")).toBeInTheDocument();

			rerender(<FacilityHoverCard hover={null} messages={EN_MESSAGES.map} />);
			expect(screen.getByTestId("cluster-hover-surface")).toHaveClass("cluster-hover-out");

			rerender(<FacilityHoverCard hover={clusterHover(9, 700, 3)} messages={EN_MESSAGES.map} />);
			expect(screen.getByTestId("cluster-hover-surface")).not.toHaveClass("cluster-hover-in");
			expect(screen.getByTestId("cluster-hover-surface")).not.toHaveClass("cluster-hover-out");
			expect(screen.getByRole("tooltip")).toHaveStyle({ left: "700px" });

			rerender(<FacilityHoverCard hover={null} messages={EN_MESSAGES.map} />);
			expect(screen.getByTestId("cluster-hover-surface")).toHaveClass("cluster-hover-out");
			act(() => {
				vi.advanceTimersByTime(REVEAL_MOTION_MS.exit);
			});
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("clusterHoverMotionClass", () => {
	it("uses the reveal classes and skips them when the card retargets", () => {
		expect(clusterHoverMotionClass("enter", false)).toBe("cluster-hover-in");
		expect(clusterHoverMotionClass("exit", false)).toBe("cluster-hover-out");
		expect(clusterHoverMotionClass("shown", false)).toBe("");
		expect(clusterHoverMotionClass("hidden", false)).toBe("");
		expect(clusterHoverMotionClass("enter", true)).toBe("");
		expect(clusterHoverMotionClass("exit", true)).toBe("");
	});
});
