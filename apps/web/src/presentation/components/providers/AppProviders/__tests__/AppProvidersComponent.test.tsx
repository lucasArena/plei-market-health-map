import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { AppProviders } from "@/presentation/components/providers/AppProviders/AppProvidersComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

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
