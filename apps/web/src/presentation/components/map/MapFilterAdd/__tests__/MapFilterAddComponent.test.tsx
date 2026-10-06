import { render } from "@testing-library/react";
import {
	MapFilterAddButton,
	MapFilterChevron,
	MapFilterRowPrefix,
} from "@/presentation/components/map/MapFilterAdd/MapFilterAddComponent";

describe("MapFilterAdd", () => {
	it("rotates the chevron for open and right-pointing states", () => {
		const { container, rerender } = render(<MapFilterChevron open={false} />);
		const svg = () => container.querySelector("svg");
		expect(svg()).not.toHaveClass("rotate-180");
		expect(svg()).not.toHaveClass("-rotate-90");
		rerender(<MapFilterChevron open={true} />);
		expect(svg()).toHaveClass("rotate-180");
		rerender(<MapFilterChevron open={false} pointsRight />);
		expect(svg()).toHaveClass("-rotate-90");
		rerender(<MapFilterChevron open={true} pointsRight />);
		expect(svg()).not.toHaveClass("-rotate-90");
	});

	it("shows or hides the add prefix", () => {
		const { container, rerender } = render(<MapFilterRowPrefix />);
		expect(container.querySelector("span")).not.toHaveClass("invisible");
		rerender(<MapFilterRowPrefix blank />);
		expect(container.querySelector("span")).toHaveClass("invisible");
	});

	it("renders the add filter button with expansion state", () => {
		const { getByRole } = render(
			<MapFilterAddButton label="Add filter" open={true} onClick={() => undefined} />,
		);
		expect(getByRole("button", { name: "Add filter" })).toHaveAttribute("aria-expanded", "true");
	});
});
