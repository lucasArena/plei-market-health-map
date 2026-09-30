import { IssueTrackerError } from "@core/application/errors/issue-tracker-error";

describe("IssueTrackerError", () => {
	it("keeps the issue tracker's cause", () => {
		const cause = new Error("socket hang up");
		const error = new IssueTrackerError("Could not reach Linear.", { cause });
		expect(error).toMatchObject({ code: "ISSUE_TRACKER_FAILED", cause });
	});
});
