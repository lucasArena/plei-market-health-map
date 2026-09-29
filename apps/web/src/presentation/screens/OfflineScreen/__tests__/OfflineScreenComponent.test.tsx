import { render, screen } from "@testing-library/react";
import { OfflineScreen } from "@/presentation/screens/OfflineScreen/OfflineScreenComponent";

describe("OfflineScreen", () => {
	it("explains that the app is offline", () => {
		render(<OfflineScreen title="You are offline" description="Reconnect to keep going." />);

		expect(screen.getByRole("heading", { name: "You are offline" })).toBeInTheDocument();
		expect(screen.getByText("Reconnect to keep going.")).toBeInTheDocument();
	});
});
