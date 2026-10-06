import { fireEvent, screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { GameDepartmentFilter } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent";
import { MapLayersProvider } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

it("selects multiple departments, deselects and resets without closing the menu", () => {
	renderWithMessages(
		<MapLayersProvider>
			<GameDepartmentFilter enabled />
		</MapLayersProvider>,
	);
	const trigger = screen.getByRole("button", { name: "Department" });
	expect(trigger).toHaveTextContent("All departments");
	fireEvent.click(trigger);
	const magic = screen.getByRole("checkbox", { name: "Magic" });
	expect(magic).toHaveFocus();
	fireEvent.click(magic);
	fireEvent.click(screen.getByRole("checkbox", { name: "Organizers" }));
	expect(trigger).toHaveTextContent("Magic, Organizers");
	expect(screen.getByRole("checkbox", { name: "Partnerships" })).not.toBeChecked();
	fireEvent.click(magic);
	expect(trigger).toHaveTextContent("Organizers");
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(trigger).toHaveTextContent("All departments");
	expect(screen.getByRole("dialog", { name: "Department" })).toHaveClass("map-glass");
	fireEvent.keyDown(magic, { key: "Escape" });
	expect(trigger).toHaveFocus();
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	fireEvent.click(trigger);
	fireEvent.pointerDown(document.body);
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("closes the menu when the Games layer is disabled", () => {
	const { rerender } = renderWithMessages(
		<MapLayersProvider>
			<GameDepartmentFilter enabled />
		</MapLayersProvider>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Department" }));
	fireEvent.keyDown(screen.getByRole("checkbox", { name: "Magic" }), { key: "Tab" });
	expect(screen.getByRole("dialog")).toBeInTheDocument();
	rerender(
		<MapLayersProvider>
			<GameDepartmentFilter enabled={false} />
		</MapLayersProvider>,
	);
	expect(screen.getByRole("button", { name: "Department" })).toBeDisabled();
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
