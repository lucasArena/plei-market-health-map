import { render, screen } from "@testing-library/react";
import { Avatar } from "@/presentation/components/displays/Avatar/AvatarComponent";
import {
	AVATAR_COLORS,
	getInitials,
	MUTED_AVATAR_BACKGROUNDS,
	pickAvatarColor,
	pickMutedAvatarColor,
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

	it("renders a 20px muted disc for compact lists", () => {
		render(<Avatar name="Central North" avatarUrl={null} appearance="muted" />);
		const initials = screen.getByText("CN");
		expect(initials).toHaveAttribute("data-appearance", "muted");
		expect(initials).toHaveClass("size-5", "text-[10px]", "text-foreground");
		expect(initials).toHaveStyle({ backgroundColor: pickMutedAvatarColor("Central North") });
		expect(initials).toHaveClass("rounded-full", "ring-0", "outline-none", "border-0");
		expect(initials).not.toHaveClass("border-2", "ring-1", "ring-2");
	});

	it("gives muted fallbacks different stable backgrounds", () => {
		const names = ["Alpha Court", "Beta Court", "Gamma Court", "Delta Court", "Echo Court"];
		const colors = names.map((name) => pickMutedAvatarColor(name));
		expect(new Set(colors).size).toBeGreaterThan(1);
		expect(pickMutedAvatarColor("Alpha Court")).toBe(pickMutedAvatarColor("Alpha Court"));
		expect(Object.values(MUTED_AVATAR_BACKGROUNDS)).toContain(pickMutedAvatarColor("Alpha Court"));
	});

	it("leaves facility fallbacks without a pitch-green stroke", () => {
		const { rerender } = render(<Avatar name="Active Dome" avatarUrl={null} appearance="muted" />);
		const initials = screen.getByText("AD");
		expect(initials).toHaveClass("border-0", "shadow-none", "ring-0", "outline-none");
		expect(initials).not.toHaveClass("border-2", "border-pleiful-pitch-green-80");
		rerender(<Avatar name="Quiet Dome" avatarUrl={null} appearance="muted" />);
		expect(screen.getByText("QD")).toHaveClass("border-0");
		expect(screen.getByText("QD")).not.toHaveClass("border-2", "border-pleiful-pitch-green-80");
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
		expect(pickMutedAvatarColor("Eastside")).toBe(pickMutedAvatarColor("Eastside"));
		expect(Object.values(MUTED_AVATAR_BACKGROUNDS)).toContain(pickMutedAvatarColor("Northside"));
	});
});
