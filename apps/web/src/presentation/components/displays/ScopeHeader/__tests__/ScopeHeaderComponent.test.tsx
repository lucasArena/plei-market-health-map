import { render, screen } from "@testing-library/react";
import { ScopeHeader } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent";

const HEADER = {
	breadcrumb: [
		{ key: "all", label: "All markets", onSelect: vi.fn() },
		{ key: "889", label: "Pegaso HTX" },
	],
	breadcrumbLabel: "Location",
	title: "Pegaso HTX",
	level: "Facility",
	subtitle: "123 Main St, Houston",
	comparison: { current: "Sep 11 – Oct 8, 2026", previous: "vs Aug 14 – Sep 10" },
	footnote: "30 of 89 facilities active",
};

describe("ScopeHeader", () => {
	it("shows where you are, the dates and a footnote", () => {
		render(<ScopeHeader header={HEADER} testId="scope" />);

		expect(screen.getByRole("heading", { name: "Pegaso HTX" })).toBeInTheDocument();
		expect(screen.getByText("Facility · 123 Main St, Houston")).toBeInTheDocument();
		expect(screen.getByTestId("scope-dates")).toHaveTextContent(
			"Sep 11 – Oct 8, 2026vs Aug 14 – Sep 10",
		);
		expect(screen.getByText("30 of 89 facilities active")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "7D" })).not.toBeInTheDocument();
	});

	it("leaves out an empty subtitle and footnote", () => {
		render(<ScopeHeader header={{ ...HEADER, subtitle: null, footnote: null }} testId="scope" />);

		expect(screen.queryByRole("button", { name: "7D" })).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Pegaso HTX" })).toHaveAttribute(
			"title",
			"Pegaso HTX",
		);

		expect(screen.getByText("Facility")).toBeInTheDocument();
		expect(screen.queryByText("30 of 89 facilities active")).not.toBeInTheDocument();
	});
});
