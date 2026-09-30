import { DryRunIssueTracker } from "@server/infrastructure/linear/dry-run-issue-tracker";

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
			description: "b",
		});
		const second = await tracker.createIssue({
			type: "improvement",
			title: "[MHM feedback] c",
			description: "d",
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
	});

	it("logs to the console by default", async () => {
		const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);

		await new DryRunIssueTracker().createIssue({ type: "bug", title: "t", description: "d" });

		expect(spy).toHaveBeenCalledWith("[feedback:dry-run] would create issue", expect.any(String));
		spy.mockRestore();
	});
});
