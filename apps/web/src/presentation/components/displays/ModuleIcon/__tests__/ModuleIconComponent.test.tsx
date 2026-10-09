import { render, screen } from "@testing-library/react";
import { ModuleIcon } from "@/presentation/components/displays/ModuleIcon/ModuleIconComponent";

describe("ModuleIcon", () => {
	it.each(["games", "users", "markets", "facilities"] as const)(
		"draws the %s icon at 14px in #525866, hidden from screen readers",
		(name) => {
			render(<ModuleIcon name={name} />);
			const icon = screen.getByTestId(`module-icon-${name}`);
			expect(icon).toHaveAttribute("aria-hidden", "true");
			expect(icon).toHaveAttribute("width", "14");
			expect(icon).toHaveAttribute("height", "14");
			expect(icon).toHaveClass("text-[#525866]");
			expect(icon.children.length).toBeGreaterThan(0);
		},
	);
});
