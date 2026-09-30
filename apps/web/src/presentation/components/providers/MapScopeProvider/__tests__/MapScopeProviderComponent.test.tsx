import { fireEvent, render, screen } from "@testing-library/react";
import {
	MapScopeProvider,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";

function Probe() {
	const { scope, setScope } = useMapScope();
	return (
		<button
			type="button"
			onClick={() => setScope({ kind: "market", id: "philly", name: "Philly" })}
		>
			{scope.kind}
		</button>
	);
}

describe("MapScopeProvider", () => {
	it("starts on all markets and shares scope changes", () => {
		render(
			<MapScopeProvider>
				<Probe />
			</MapScopeProvider>,
		);

		expect(screen.getByRole("button")).toHaveTextContent("all");
		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByRole("button")).toHaveTextContent("market");
	});

	it("falls back to all markets and ignores changes outside the provider", () => {
		render(<Probe />);

		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByRole("button")).toHaveTextContent("all");
	});
});
