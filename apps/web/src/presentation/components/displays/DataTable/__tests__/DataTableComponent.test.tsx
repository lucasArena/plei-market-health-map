import { render, screen, within } from "@testing-library/react";
import { DataTable } from "@/presentation/components/displays/DataTable/DataTableComponent";

const COLUMNS = [
	{ key: "name", label: "Person" },
	{ key: "visits", label: "Visits", align: "right" as const },
];

describe("DataTable", () => {
	it("renders a row per item under its column headers", () => {
		render(
			<DataTable
				caption="People"
				columns={COLUMNS}
				rows={[{ key: "a", cells: { name: "Stefano", visits: 9 } }]}
				emptyLabel="Nobody"
			/>,
		);

		const table = screen.getByRole("table", { name: "People" });
		expect(within(table).getByRole("columnheader", { name: "Visits" })).toHaveClass("text-right");
		expect(within(table).getByRole("cell", { name: "Stefano" })).toBeInTheDocument();
		expect(within(table).getByRole("cell", { name: "9" })).toHaveClass("text-right");
	});

	it("says so when there are no rows", () => {
		render(<DataTable caption="People" columns={COLUMNS} rows={[]} emptyLabel="Nobody" />);

		expect(screen.getByRole("cell", { name: "Nobody" })).toHaveAttribute("colspan", "2");
	});
});
