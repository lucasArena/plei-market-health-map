import { screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { AdminTabs } from "@/presentation/components/layout/AdminTabs/AdminTabsComponent";

describe("AdminTabs", () => {
	it("links both admin pages and marks the current one", () => {
		renderWithMessages(<AdminTabs active="featureFlags" />);

		const nav = screen.getByRole("navigation", { name: "Admin pages" });
		const metrics = screen.getByRole("link", { name: "App metrics" });
		const flags = screen.getByRole("link", { name: "Feature flags" });

		expect(nav).toContainElement(flags);
		expect(metrics).toHaveAttribute("href", "/metrics");
		expect(metrics).not.toHaveAttribute("aria-current");
		expect(flags).toHaveAttribute("href", "/feature-flags");
		expect(flags).toHaveAttribute("aria-current", "page");
	});
});
