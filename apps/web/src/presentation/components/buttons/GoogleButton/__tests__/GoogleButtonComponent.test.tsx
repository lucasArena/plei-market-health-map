import { render, screen } from "@testing-library/react";
import { GoogleButton } from "@/presentation/components/buttons/GoogleButton/GoogleButtonComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/buttons/GoogleButton/GoogleButtonComponent.rules", () => ({
	useGoogleButtonRules: () => mockRules(),
}));

const PROPS = { label: "Continue with Google", pendingLabel: "Redirecting…" };

describe("GoogleButton", () => {
	it("is a submit button with the Google mark", () => {
		mockRules.mockReturnValue({ isPending: false, text: "Continue with Google" });
		const { container } = render(<GoogleButton {...PROPS} />);

		const button = screen.getByRole("button", { name: "Continue with Google" });
		expect(button).toHaveAttribute("type", "submit");
		expect(button).toBeEnabled();
		expect(container.querySelectorAll("svg path")).toHaveLength(4);
	});

	it("is disabled while pending", () => {
		mockRules.mockReturnValue({ isPending: true, text: "Redirecting…" });
		render(<GoogleButton {...PROPS} />);

		expect(screen.getByRole("button", { name: "Redirecting…" })).toBeDisabled();
	});
});
