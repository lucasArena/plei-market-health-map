import { fireEvent, render, screen, within } from "@testing-library/react";
import { Breadcrumb } from "@/presentation/components/displays/InsightBreadcrumb/InsightBreadcrumbComponent";

describe("Breadcrumb", () => {
	it("renders earlier crumbs as buttons and the last one as the current page", () => {
		const goAll = vi.fn();
		const goMarket = vi.fn();
		render(
			<Breadcrumb
				label="Breadcrumb"
				items={[
					{ key: "all", label: "All markets", title: "All markets", onSelect: goAll },
					{ key: "m", label: "Miami Metro", title: "Market: Miami Metro", onSelect: goMarket },
					{ key: "f", label: "Pegaso Soccer Miami", title: "Facility: Pegaso Soccer Miami" },
				]}
			/>,
		);

		const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
		const items = within(nav).getAllByRole("listitem");
		expect(items).toHaveLength(3);
		const all = within(nav).getByRole("button", { name: "All markets" });
		const market = within(nav).getByRole("button", { name: "Miami Metro" });
		expect(market).toHaveAttribute("title", "Market: Miami Metro");
		expect(market).toHaveClass(
			"text-[#525866]",
			"hover:underline",
			"focus-visible:outline-2",
			"truncate",
		);
		fireEvent.click(all);
		fireEvent.click(market);
		expect(goAll).toHaveBeenCalledOnce();
		expect(goMarket).toHaveBeenCalledOnce();

		const current = within(nav).getByText("Pegaso Soccer Miami");
		expect(current).toHaveAttribute("aria-current", "page");
		expect(current.tagName).toBe("SPAN");
		expect(current).toHaveClass("truncate");
		expect(current).toHaveAttribute("title", "Facility: Pegaso Soccer Miami");
		expect(within(nav).getAllByRole("button")).toHaveLength(2);
		const separators = nav.querySelectorAll("[aria-hidden='true']");
		expect(separators).toHaveLength(2);
		expect(nav).toHaveTextContent("All markets/Miami Metro/Pegaso Soccer Miami");
	});

	it("shows an earlier crumb without a target as plain text and a single crumb as current", () => {
		const { rerender } = render(
			<Breadcrumb
				label="Breadcrumb"
				items={[
					{ key: "m", label: "Miami Metro", title: "Market: Miami Metro" },
					{ key: "f", label: "Pegaso", title: "Facility: Pegaso" },
				]}
			/>,
		);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.getByText("Miami Metro")).not.toHaveAttribute("aria-current");

		rerender(
			<Breadcrumb
				label="Breadcrumb"
				items={[{ key: "all", label: "All markets", title: "All markets" }]}
			/>,
		);
		expect(screen.getByText("All markets")).toHaveAttribute("aria-current", "page");
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
	it("keeps every crumb on one line, shrinking earlier crumbs before the current one", () => {
		const onAll = vi.fn();
		render(
			<Breadcrumb
				label="Breadcrumb"
				currentId="current-crumb"
				items={[
					{ key: "all", label: "All markets", title: "All markets", onSelect: onAll },
					{ key: "market", label: "Miami Metro", title: "Market: Miami Metro" },
				]}
			/>,
		);

		const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
		expect(nav.querySelector("ol")).toHaveClass("flex-nowrap", "overflow-hidden");
		const current = within(nav).getByText("Miami Metro");
		expect(current).toHaveAttribute("id", "current-crumb");
		expect(current).toHaveAttribute("aria-current", "page");
		expect(current).toHaveAttribute("title", "Market: Miami Metro");
		expect(current.tagName).toBe("SPAN");
		expect(current.closest("li")).toHaveClass("min-w-0", "shrink");

		const link = within(nav).getByRole("button", { name: "All markets" });
		expect(link).toHaveClass("text-[#525866]", "hover:underline", "truncate");
		expect(link.closest("li")).toHaveClass("shrink-[100]");
		fireEvent.click(link);
		expect(onAll).toHaveBeenCalledOnce();
	});
});
