import { render, screen } from "@testing-library/react";
import { FacilitiesTableSkeleton } from "@/presentation/components/map/FacilitiesTableSkeleton/FacilitiesTableSkeletonComponent";

describe("FacilitiesTableSkeleton", () => {
	it("draws placeholder rows shaped like the table", () => {
		const { rerender } = render(<FacilitiesTableSkeleton />);

		const skeleton = screen.getByTestId("facilities-table-skeleton");
		expect(skeleton).toHaveAttribute("aria-hidden", "true");
		expect(skeleton.querySelectorAll("li")).toHaveLength(6);

		rerender(<FacilitiesTableSkeleton rows={2} />);
		expect(screen.getByTestId("facilities-table-skeleton").querySelectorAll("li")).toHaveLength(2);
	});
});
