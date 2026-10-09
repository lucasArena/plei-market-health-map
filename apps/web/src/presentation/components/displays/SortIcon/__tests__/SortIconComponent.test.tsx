import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SortIcon } from "@/presentation/components/displays/SortIcon/SortIconComponent";

describe("SortIcon", () => {
	it("shows staging's 12px muted chevron, up for ascending", () => {
		render(<SortIcon isActive direction="asc" />);
		const icon = screen.getByTestId("sort-icon");
		expect(icon).toHaveAttribute("aria-hidden", "true");
		expect(icon).toHaveAttribute("stroke-width", "1.25");
		expect(icon).toHaveClass("size-3", "text-muted-foreground", "opacity-80");
		expect(icon.querySelector("path")).toHaveAttribute("d", "m4 10 4-4 4 4");
	});

	it("points down for descending and hides on inactive columns until hover", () => {
		const { rerender } = render(<SortIcon isActive direction="desc" />);
		expect(screen.getByTestId("sort-icon").querySelector("path")).toHaveAttribute(
			"d",
			"m4 6 4 4 4-4",
		);
		rerender(<SortIcon isActive={false} direction="asc" />);
		expect(screen.getByTestId("sort-icon")).toHaveClass("opacity-0", "group-hover:opacity-40");
	});
});
