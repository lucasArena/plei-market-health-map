import { screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MapBrand } from "@/presentation/components/layout/MapBrand/MapBrandComponent";

describe("MapBrand", () => {
	it("shows the app name and logo on the glass surface and links home", () => {
		renderWithMessages(<MapBrand />);

		const brand = screen.getByRole("link", { name: "Market Health Map" });
		expect(brand).toHaveAttribute("href", "/");
		expect(brand).toHaveClass(
			"map-glass",
			"h-[32px]",
			"gap-[4px]",
			"rounded-full",
			"pl-[8px]",
			"pr-[10px]",
			"shadow-[var(--map-shadow)]",
		);
		const label = screen.getByText("Market Health Map");
		expect(label).toHaveClass("text-[12px]", "font-semibold", "text-foreground");
		expect(brand.querySelector("img")).toHaveAttribute("width", "16");
		expect(brand.querySelector("img")).toHaveAttribute("height", "16");
		expect(brand.querySelector("img")).toHaveAttribute(
			"src",
			expect.stringContaining("plei-logo.svg"),
		);
	});
});
