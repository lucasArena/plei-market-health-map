import { fireEvent, screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { GameDepartmentFilter } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent";
import { MapLayersProvider } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

function addDepartment() {
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("option", { name: "Department" }));
}

it("adds Department, stages multiple choices and applies them with matching filter styling", () => {
	renderWithMessages(
		<MapLayersProvider>
			<GameDepartmentFilter enabled />
		</MapLayersProvider>,
	);
	expect(screen.queryByRole("button", { name: "Department" })).not.toBeInTheDocument();
	expect(screen.getByText("All games")).toBeInTheDocument();
	addDepartment();
	const magic = screen.getByRole("option", { name: "Magic" });
	expect(magic).toHaveFocus();
	expect(screen.getByRole("listbox", { name: "Department" }).parentElement).toHaveClass(
		"map-glass",
		"rounded-[var(--map-radius)]",
	);
	fireEvent.click(magic);
	fireEvent.click(screen.getByRole("option", { name: "Organizers" }));
	expect(screen.getByRole("button", { name: "Department" })).toHaveTextContent("Magic, Organizers");
	expect(screen.getByText("All games")).toBeInTheDocument();
	fireEvent.click(magic);
	expect(magic).toHaveAttribute("aria-selected", "false");
	fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Apply filters" })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Department" }));
	fireEvent.click(screen.getByRole("button", { name: "Close filter options" }));
	fireEvent.click(screen.getByRole("button", { name: "Remove Department filter" }));
	expect(screen.queryByRole("button", { name: "Department" })).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Add filter" })).toBeEnabled();
});

it("supports option keyboard navigation, Escape, outside dismissal and disabling", () => {
	const { rerender } = renderWithMessages(
		<MapLayersProvider>
			<GameDepartmentFilter enabled />
		</MapLayersProvider>,
	);
	addDepartment();
	const magic = screen.getByRole("option", { name: "Magic" });
	fireEvent.keyDown(magic, { key: "ArrowDown" });
	const organizers = screen.getByRole("option", { name: "Organizers" });
	expect(organizers).toHaveFocus();
	fireEvent.keyDown(organizers, { key: "ArrowUp" });
	expect(magic).toHaveFocus();
	fireEvent.keyDown(magic, { key: "End" });
	const partnerships = screen.getByRole("option", { name: "Partnerships" });
	expect(partnerships).toHaveFocus();
	fireEvent.keyDown(partnerships, { key: "Home" });
	expect(magic).toHaveFocus();
	fireEvent.keyDown(magic, { key: "Tab" });
	fireEvent.keyDown(magic, { key: "Escape" });
	fireEvent.click(screen.getByRole("button", { name: "Department" }));
	fireEvent.pointerDown(document.body);
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Department" }));
	rerender(
		<MapLayersProvider>
			<GameDepartmentFilter enabled={false} />
		</MapLayersProvider>,
	);
	expect(screen.getByRole("button", { name: "Department" })).toBeDisabled();
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
