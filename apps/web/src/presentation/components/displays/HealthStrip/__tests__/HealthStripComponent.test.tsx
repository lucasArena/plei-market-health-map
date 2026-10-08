import { fireEvent, render, screen } from "@testing-library/react";
import { HealthStrip } from "@/presentation/components/displays/HealthStrip/HealthStripComponent";

function stubHeights(scrollHeight: number, clientHeight: number) {
	const scroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
	const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
	Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
		configurable: true,
		get: () => scrollHeight,
	});
	Object.defineProperty(HTMLElement.prototype, "clientHeight", {
		configurable: true,
		get: () => clientHeight,
	});
	return () => {
		if (scroll) Object.defineProperty(HTMLElement.prototype, "scrollHeight", scroll);
		if (client) Object.defineProperty(HTMLElement.prototype, "clientHeight", client);
	};
}

function renderStrip() {
	return render(
		<HealthStrip showMoreLabel="Show more" showLessLabel="Show less">
			<p>Pegaso Soccer Miami needs attention.</p>
		</HealthStrip>,
	);
}

describe("HealthStrip", () => {
	it("shows everything without a toggle when the insight fits", () => {
		const restore = stubHeights(100, 100);
		renderStrip();

		expect(screen.getByText("Pegaso Soccer Miami needs attention.")).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		restore();
	});

	it("fades a long insight and expands it on Show more", () => {
		const restore = stubHeights(300, 176);
		renderStrip();
		const content = screen.getByText("Pegaso Soccer Miami needs attention.").parentElement;

		expect(content).toHaveAttribute("data-collapsed", "true");
		fireEvent.click(screen.getByRole("button", { name: "Show more" }));

		expect(content).toHaveAttribute("data-collapsed", "false");
		expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		fireEvent.click(screen.getByRole("button", { name: "Show less" }));
		expect(screen.getByRole("button", { name: "Show more" })).toBeInTheDocument();
		restore();
	});
});
