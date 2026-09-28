import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import { AppProviders } from "@/components/providers/AppProviders/AppProvidersComponent";
import { EN_MESSAGES } from "@/test/messages";

function Probe() {
	const { messages } = useMessages();
	const client = useQueryClient();
	return (
		<span>
			{messages.common.appName}:{String(client.getDefaultOptions().queries?.staleTime)}
		</span>
	);
}

describe("AppProviders", () => {
	it("provides messages and a configured query client", () => {
		render(
			<AppProviders locale="en" messages={EN_MESSAGES}>
				<Probe />
			</AppProviders>,
		);

		expect(screen.getByText("Market Health Map:30000")).toBeInTheDocument();
	});
});
