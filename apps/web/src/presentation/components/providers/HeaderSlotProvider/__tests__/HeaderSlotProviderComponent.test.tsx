import { render, screen } from "@testing-library/react";
import { createPortal } from "react-dom";
import {
	HeaderSlotProvider,
	useHeaderSlot,
} from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";

function Slot() {
	const { setSearchSlot } = useHeaderSlot();
	return <div data-testid="slot" ref={setSearchSlot} />;
}

function Content() {
	const { searchSlot } = useHeaderSlot();
	return searchSlot ? createPortal(<span>search</span>, searchSlot) : null;
}

describe("HeaderSlotProvider", () => {
	it("shares the header slot so content can portal into it", () => {
		render(
			<HeaderSlotProvider>
				<Slot />
				<Content />
			</HeaderSlotProvider>,
		);

		expect(screen.getByTestId("slot")).toHaveTextContent("search");
	});

	it("has no slot outside the provider", () => {
		render(
			<>
				<Slot />
				<Content />
			</>,
		);

		expect(screen.getByTestId("slot")).toBeEmptyDOMElement();
	});
});
