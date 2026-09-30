import { fireEvent, render, screen } from "@testing-library/react";
import { Pagination } from "@/presentation/components/displays/Pagination/PaginationComponent";

function renderPage(page: number, pageCount: number) {
	const onPageChange = vi.fn();
	render(
		<Pagination
			page={page}
			pageCount={pageCount}
			onPageChange={onPageChange}
			previousLabel="Previous"
			nextLabel="Next"
			statusLabel={`Page ${page} of ${pageCount}`}
		/>,
	);
	return onPageChange;
}

describe("Pagination", () => {
	it("moves to the previous and next page", () => {
		const onPageChange = renderPage(2, 3);

		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		expect(onPageChange.mock.calls).toEqual([[1], [3]]);
		expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
	});

	it("disables the buttons at the edges", () => {
		renderPage(1, 1);

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});
});
