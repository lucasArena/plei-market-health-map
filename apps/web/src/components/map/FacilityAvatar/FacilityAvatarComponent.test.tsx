import { render, screen } from "@testing-library/react";
import { FacilityAvatar } from "@/components/map/FacilityAvatar/FacilityAvatarComponent";
import {
	AVATAR_COLORS,
	getInitials,
	pickAvatarColor,
} from "@/components/map/FacilityAvatar/FacilityAvatarComponent.rules";

describe("FacilityAvatar", () => {
	it("shows the facility image when there is one", () => {
		const { container } = render(
			<FacilityAvatar name="Eastside Futsal" avatarUrl="https://cdn.plei.app/f.png" />,
		);
		expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn.plei.app/f.png");
	});

	it("falls back to colored initials", () => {
		render(<FacilityAvatar name="Eastside Futsal Arena" avatarUrl={null} />);
		expect(screen.getByText("EF")).toHaveAttribute("data-size", "sm");
	});

	it("renders a large variant", () => {
		render(<FacilityAvatar name="Eastside Futsal Arena" avatarUrl={null} size="lg" />);
		expect(screen.getByText("EF")).toHaveClass("size-20");
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
