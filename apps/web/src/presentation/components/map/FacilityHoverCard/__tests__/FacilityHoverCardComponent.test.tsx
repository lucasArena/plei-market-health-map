import { render, screen } from "@testing-library/react";
import { FacilityHoverCard } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent";
import { EN_MESSAGES } from "@/test/messages";

function facility(id: string, name: string) {
	return {
		id,
		marketId: "austin",
		name,
		avatarUrl: null,
		isActive: true,
		location: { latitude: 30.27, longitude: -97.74 },
	};
}

const FACILITIES = [facility("f1", "Eastside Futsal Arena"), facility("f2", "Harbor Sports Dome")];

describe("FacilityHoverCard", () => {
	it("shows a single facility's logo and name beside the pointer", () => {
		render(
			<FacilityHoverCard
				hover={{
					kind: "facility",
					facility: FACILITIES[0] ?? facility("x", "x"),
					x: 100,
					y: 50,
					flipX: false,
					flipY: false,
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		const card = screen.getByRole("tooltip");
		expect(card).toHaveTextContent("EFEastside Futsal Arena");
		expect(card).toHaveStyle({ left: "114px", top: "64px" });
	});

	it("flips above and to the left of the pointer near the edges", () => {
		render(
			<FacilityHoverCard
				hover={{
					kind: "cluster",
					clusterId: 7,
					total: 2,
					facilities: FACILITIES,
					x: 900,
					y: 700,
					flipX: true,
					flipY: true,
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.getByRole("tooltip")).toHaveStyle({
			left: "886px",
			top: "686px",
			transform: "translate(-100%, -100%)",
		});
	});

	it("lists the facilities gathered in a cluster with a remainder", () => {
		render(
			<FacilityHoverCard
				hover={{
					kind: "cluster",
					clusterId: 7,
					total: 12,
					facilities: FACILITIES,
					x: 0,
					y: 0,
					flipX: false,
					flipY: false,
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.getByText("12 facilities")).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
		expect(screen.getByText("Harbor Sports Dome")).toBeInTheDocument();
		expect(screen.getByText("+10 more")).toBeInTheDocument();
	});

	it("shows only the count while the cluster's facilities load", () => {
		render(
			<FacilityHoverCard
				hover={{
					kind: "cluster",
					clusterId: 7,
					total: 12,
					facilities: [],
					x: 0,
					y: 0,
					flipX: false,
					flipY: false,
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.getByText("12 facilities")).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
		expect(screen.queryByText(/more/)).not.toBeInTheDocument();
	});

	it("omits the remainder when every facility is listed", () => {
		render(
			<FacilityHoverCard
				hover={{
					kind: "cluster",
					clusterId: 7,
					total: 2,
					facilities: FACILITIES,
					x: 0,
					y: 0,
					flipX: false,
					flipY: false,
				}}
				messages={EN_MESSAGES.map}
			/>,
		);

		expect(screen.queryByText(/more/)).not.toBeInTheDocument();
	});
});
