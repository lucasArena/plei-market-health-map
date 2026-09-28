import { render, screen } from "@testing-library/react";
import { RecentLogins } from "@/components/logins/RecentLogins/RecentLoginsComponent";
import { EN_MESSAGES } from "@/test/messages";

const mockRules = vi.fn();

vi.mock("@/components/logins/RecentLogins/RecentLoginsComponent.rules", () => ({
	useRecentLoginsRules: () => mockRules(),
}));

const ROW = {
	id: "1",
	userId: "user_1",
	email: "dev@plei.com",
	signedInAt: "2026-09-28T10:00:00.000Z",
	signedInLabel: "Sep 28, 2026, 10:00 AM",
};

describe("RecentLogins", () => {
	it("lists recent sign-ins", () => {
		mockRules.mockReturnValue({ messages: EN_MESSAGES.logins, rows: [ROW], status: "ready" });

		render(<RecentLogins />);

		expect(screen.getByRole("heading", { name: "Recent sign-ins" })).toBeInTheDocument();
		expect(screen.getByText("dev@plei.com")).toBeInTheDocument();
		expect(screen.getByText(ROW.signedInLabel)).toHaveAttribute("datetime", ROW.signedInAt);
	});

	it.each([
		["loading", EN_MESSAGES.logins.loading],
		["error", EN_MESSAGES.logins.failed],
		["empty", EN_MESSAGES.logins.empty],
	])("shows the %s state", (status, text) => {
		mockRules.mockReturnValue({ messages: EN_MESSAGES.logins, rows: [], status });

		render(<RecentLogins />);

		expect(screen.getByRole("status")).toHaveTextContent(text);
	});
});
