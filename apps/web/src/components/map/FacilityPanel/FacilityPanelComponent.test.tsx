import { fireEvent, screen } from "@testing-library/react";
import { FacilityPanel } from "@/components/map/FacilityPanel/FacilityPanelComponent";
import { EN_MESSAGES } from "@/test/messages";
import { renderWithMessages } from "@/test/render-with-messages";

const FACILITY = {
	id: "f1",
	marketId: "austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	location: { latitude: 30.27, longitude: -97.74 },
};

describe("FacilityPanel", () => {
	it("shows only the facility logo and name", () => {
		renderWithMessages(<FacilityPanel facility={FACILITY} onClose={vi.fn()} />);

		expect(screen.getByRole("complementary", { name: "Facility details" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Eastside Futsal Arena" })).toBeInTheDocument();
		expect(screen.getByText("EF")).toHaveAttribute("data-size", "lg");
	});

	it("closes from the button and on Escape only", () => {
		const onClose = vi.fn();
		const { unmount } = renderWithMessages(<FacilityPanel facility={FACILITY} onClose={onClose} />);

		fireEvent.click(screen.getByRole("button", { name: EN_MESSAGES.facility.close }));
		fireEvent.keyDown(window, { key: "Enter" });
		fireEvent.keyDown(window, { key: "Escape" });
		unmount();
		fireEvent.keyDown(window, { key: "Escape" });

		expect(onClose).toHaveBeenCalledTimes(2);
	});
});
