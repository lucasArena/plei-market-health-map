import { fireEvent, render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/presentation/components/displays/Breadcrumb/BreadcrumbComponent";

describe("Breadcrumb", () => {
	it("links back up the levels and marks the current one", () => {
		const onSelect = vi.fn();
		render(
			<Breadcrumb
				label="Location"
				items={[
					{ key: "all", label: "All markets", onSelect },
					{ key: "market", label: "Miami Metro" },
				]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "All markets" }));
		expect(onSelect).toHaveBeenCalledOnce();
		expect(screen.getByText("Miami Metro")).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("navigation", { name: "Location" })).toBeInTheDocument();
	});
});
