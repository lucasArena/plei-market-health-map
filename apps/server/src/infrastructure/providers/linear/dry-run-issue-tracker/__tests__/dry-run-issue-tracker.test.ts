import { DryRunIssueTracker } from "@server/infrastructure/providers/linear/dry-run-issue-tracker/dry-run-issue-tracker";

describe("DryRunIssueTracker", () => {
	it("logs the would-be upload and issue and returns fake identifiers", async () => {
		const log = vi.fn();
		const tracker = new DryRunIssueTracker({ log });

		const assetUrl = await tracker.uploadAttachment({
			filename: "my shot.png",
			contentType: "image/png",
			bytes: new Uint8Array(3),
		});
		const first = await tracker.createIssue({
			type: "bug",
			title: "[MHM bug] a",
			requestBody: "b",
			submitter: { displayName: "Stefano Sanchez" },
		});
		const second = await tracker.createIssue({
			type: "improvement",
			title: "[MHM feedback] c",
			requestBody: "d",
			submitter: { displayName: "Stefano Sanchez" },
		});

		expect(assetUrl).toBe("https://uploads.linear.app/dry-run/1/my%20shot.png");
		expect(first).toEqual({ identifier: "DRY-1", url: "https://linear.app/dry-run/issue/DRY-1" });
		expect(second.identifier).toBe("DRY-2");
		expect(log).toHaveBeenCalledWith(
			"[feedback:dry-run] would upload",
			JSON.stringify({ filename: "my shot.png", contentType: "image/png", size: 3 }),
		);
		const payload = JSON.parse(log.mock.calls[1]?.[1] as string);
		expect(payload).toMatchObject({
			teamId: "bd06d3df-8b17-42f7-96b1-0b6b7b3eb5ad",
			labelIds: ["66be57d9-22f0-4fba-a55a-9e0782dd3c0d"],
			title: "[MHM bug] a",
		});
		expect(payload).not.toHaveProperty("createAsUser");
		const requestPayload = JSON.parse(log.mock.calls[2]?.[1] as string);
		expect(requestPayload).toEqual({ issueId: "DRY-1", body: "b" });
	});

	it("logs to the console by default", async () => {
		const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);

		await new DryRunIssueTracker().createIssue({
			type: "bug",
			title: "t",
			requestBody: "d",
			submitter: { displayName: "Stefano Sanchez" },
		});

		expect(spy).toHaveBeenCalledWith("[feedback:dry-run] would create issue", expect.any(String));
		expect(spy).toHaveBeenCalledWith(
			"[feedback:dry-run] would create customer request",
			expect.any(String),
		);
		spy.mockRestore();
	});
});
