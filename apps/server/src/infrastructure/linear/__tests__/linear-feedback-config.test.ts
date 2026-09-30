import {
	DEFAULT_LINEAR_FEEDBACK_CONFIG,
	toLinearIssueInput,
} from "@server/infrastructure/linear/linear-feedback-config";

const BUG = { type: "bug" as const, title: "Blank map", description: "b" };

describe("toLinearIssueInput", () => {
	it("sends improvements to Requests triage in the Market health map project", () => {
		expect(
			toLinearIssueInput(
				{
					type: "improvement",
					title: "Add a market filter",
					description: "b",
					submitter: { displayName: "Stefano Sanchez" },
				},
				DEFAULT_LINEAR_FEEDBACK_CONFIG,
			),
		).toEqual({
			teamId: "635f83c3-3276-4ae6-aa29-5b633dc8dc38",
			stateId: "973949af-0a76-4de3-a870-de074888bc75",
			projectId: "98a63408-5cac-4a0e-85a9-1b73d17ea096",
			labelIds: [],
			title: "Add a market filter",
			description: "b",
		});
	});

	it("sends bugs to Engineering triage with the bug label", () => {
		expect(
			toLinearIssueInput(
				{ ...BUG, submitter: { displayName: "Stefano Sanchez" } },
				DEFAULT_LINEAR_FEEDBACK_CONFIG,
			),
		).toMatchObject({
			teamId: "bd06d3df-8b17-42f7-96b1-0b6b7b3eb5ad",
			stateId: "904a3068-92b9-4e7d-bd86-bc52cde54a83",
			projectId: "98a63408-5cac-4a0e-85a9-1b73d17ea096",
			labelIds: ["66be57d9-22f0-4fba-a55a-9e0782dd3c0d"],
		});
	});

	it("shows the submitter as the creator only for app tokens", () => {
		const draft = {
			...BUG,
			submitter: { displayName: "Stefano Sanchez", avatarUrl: "https://img/s.png" },
		};

		expect(
			toLinearIssueInput(draft, DEFAULT_LINEAR_FEEDBACK_CONFIG, { asApp: true }),
		).toMatchObject({ createAsUser: "Stefano Sanchez", displayIconUrl: "https://img/s.png" });
		expect(toLinearIssueInput(draft, DEFAULT_LINEAR_FEEDBACK_CONFIG)).not.toHaveProperty(
			"createAsUser",
		);
	});

	it("leaves the icon out when the submitter has no avatar", () => {
		const input = toLinearIssueInput(
			{ ...BUG, submitter: { displayName: "a@plei.com" } },
			DEFAULT_LINEAR_FEEDBACK_CONFIG,
			{ asApp: true },
		);

		expect(input.createAsUser).toBe("a@plei.com");
		expect(input).not.toHaveProperty("displayIconUrl");
	});
});
