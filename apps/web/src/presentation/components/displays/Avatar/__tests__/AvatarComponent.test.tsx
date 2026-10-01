import { render, screen } from "@testing-library/react";
import { Avatar } from "@/presentation/components/displays/Avatar/AvatarComponent";
import {
	AVATAR_COLORS,
	getInitials,
	pickAvatarColor,
} from "@/presentation/components/displays/Avatar/AvatarComponent.rules";

describe("Avatar", () => {
	it("shows the facility image when there is one", () => {
		const { container } = render(
			<Avatar name="Eastside Futsal" avatarUrl="https://cdn.plei.app/f.png" />,
		);
		expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn.plei.app/f.png");
	});

	it("falls back to colored initials", () => {
		render(<Avatar name="Eastside Futsal Arena" avatarUrl={null} />);
		expect(screen.getByText("EF")).toHaveAttribute("data-size", "sm");
	});

	it("renders a large variant", () => {
		render(<Avatar name="Eastside Futsal Arena" avatarUrl={null} size="lg" />);
		expect(screen.getByText("EF")).toHaveClass("size-20");
	});

	it("draws the account disc as a 32px gray circle with dark initials", () => {
		render(<Avatar name="Lucas Arena" avatarUrl={null} appearance="account" />);
		expect(screen.getByText("LA")).toHaveClass(
			"size-[32px]",
			"bg-[#d1d5db]",
			"text-[11px]",
			"text-[#111827]",
		);
		expect(screen.getByText("LA")).not.toHaveAttribute("style");
	});

	it("keeps an account photo inside the 32px disc", () => {
		const { container } = render(
			<Avatar name="Lucas Arena" avatarUrl="https://cdn.plei.app/a.png" appearance="account" />,
		);
		const image = container.querySelector("img");
		expect(image).toHaveAttribute("width", "32");
		expect(image).toHaveAttribute("height", "32");
		expect(image).toHaveClass("size-[32px]", "bg-[#d1d5db]");
	});
});

describe("avatar rules", () => {
	it("takes up to two initials", () => {
		expect(getInitials("  riverside   sports dome ")).toBe("RS");
		expect(getInitials("Dome")).toBe("D");
	});

	it("picks a stable color from the palette", () => {
		expect(pickAvatarColor("Eastside")).toBe(pickAvatarColor("Eastside"));
		expect(AVATAR_COLORS).toContain(pickAvatarColor("Northside"));
	});
});
