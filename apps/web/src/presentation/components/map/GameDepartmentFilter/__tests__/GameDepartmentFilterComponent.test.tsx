import { fireEvent, screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import {
	GameDepartmentFilterAdd,
	GameDepartmentFilterApply,
	GameDepartmentFilterChips,
	GameDepartmentFilters,
} from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent";
import { MapLayersProvider } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

function openDepartment() {
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	fireEvent.click(screen.getByRole("button", { name: "Department" }));
}

function renderDepartmentFilters() {
	return renderWithMessages(
		<MapLayersProvider>
			<GameDepartmentFilters enabled>
				<GameDepartmentFilterChips />
				<GameDepartmentFilterAdd />
				<GameDepartmentFilterApply />
			</GameDepartmentFilters>
		</MapLayersProvider>,
	);
}

it("adds Department, stages multiple choices and applies them with matching filter styling", () => {
	renderDepartmentFilters();
	expect(screen.queryByText("Magic")).not.toBeInTheDocument();
	openDepartment();
	const magic = screen.getByRole("checkbox", { name: "Magic" });
	expect(magic).toHaveFocus();
	expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	fireEvent.click(magic);
	fireEvent.click(screen.getByRole("checkbox", { name: "Organizers" }));
	expect(screen.queryByRole("button", { name: "Remove Magic filter" })).not.toBeInTheDocument();
	fireEvent.click(magic);
	expect(magic).not.toBeChecked();
	fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
	expect(screen.getByRole("button", { name: "Remove Organizers filter" })).toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Apply filter" })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Remove Organizers filter" }));
	expect(
		screen.queryByRole("button", { name: "Remove Organizers filter" }),
	).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Add filter" })).toBeEnabled();
});

it("supports option keyboard navigation, Escape, and disabling", () => {
	const { rerender } = renderDepartmentFilters();
	openDepartment();
	const magic = screen.getByRole("checkbox", { name: "Magic" });
	fireEvent.keyDown(magic, { key: "ArrowDown" });
	const organizers = screen.getByRole("checkbox", { name: "Organizers" });
	expect(organizers).toHaveFocus();
	fireEvent.keyDown(organizers, { key: "ArrowUp" });
	expect(magic).toHaveFocus();
	fireEvent.keyDown(magic, { key: "End" });
	const partnerships = screen.getByRole("checkbox", { name: "Partnerships" });
	expect(partnerships).toHaveFocus();
	fireEvent.keyDown(partnerships, { key: "Home" });
	expect(magic).toHaveFocus();
	fireEvent.keyDown(magic, { key: "Escape" });
	expect(screen.getByRole("button", { name: "Department" })).toHaveAttribute(
		"aria-expanded",
		"false",
	);
	fireEvent.keyDown(screen.getByRole("button", { name: "Add filter" }), { key: "Escape" });
	expect(screen.getByRole("button", { name: "Add filter" })).toHaveAttribute(
		"aria-expanded",
		"false",
	);
	openDepartment();
	rerender(
		<MapLayersProvider>
			<GameDepartmentFilters enabled={false}>
				<GameDepartmentFilterAdd />
			</GameDepartmentFilters>
		</MapLayersProvider>,
	);
	expect(screen.queryByRole("button", { name: "Add filter" })).not.toBeInTheDocument();
});

it("closes the add menu from Escape when the department list is already closed", () => {
	renderDepartmentFilters();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	const add = screen.getByRole("button", { name: "Add filter" });
	fireEvent.keyDown(add, { key: "Escape" });
	expect(add).toHaveAttribute("aria-expanded", "false");
	expect(add).toHaveFocus();
});

it("ignores department arrow keys when focus is outside the checkbox group", () => {
	renderDepartmentFilters();
	openDepartment();
	const magic = screen.getByRole("checkbox", { name: "Magic" });
	magic.blur();
	fireEvent.keyDown(document.body, { key: "ArrowDown" });
	expect(document.activeElement).not.toBe(screen.getByRole("checkbox", { name: "Organizers" }));
});

it("collapses the department submenu when Add filter closes", () => {
	renderDepartmentFilters();
	openDepartment();
	fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
	expect(screen.queryByRole("button", { name: "Department" })).not.toBeInTheDocument();
});
