import { act, renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import {
	FEEDBACK_ENDPOINT,
	FEEDBACK_UPLOAD_BUDGET_BYTES,
	submitFeedback,
	toFeedbackFormData,
	useFeedbackSubmit,
} from "@/presentation/hooks/use-feedback/use-feedback-submit";

const fitWithin = vi.fn();

vi.mock("@/infrastructure/image/image-compressor", () => ({
	imageCompressor: { fitWithin: (...args: unknown[]) => fitWithin(...args) },
	totalBytes: (files: File[]) => files.reduce((sum, file) => sum + file.size, 0),
}));

function stubFetch(status: number, body: unknown) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: status < 400,
		status,
		json: async () => {
			if (body instanceof Error) throw body;
			return body;
		},
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("toFeedbackFormData", () => {
	it("builds the multipart body with trimmed text, images and context", () => {
		const image = new File(["png"], "shot.png", { type: "image/png" });

		const form = toFeedbackFormData({
			type: "bug",
			message: "  Broken legend  ",
			images: [image, image],
			pageUrl: "http://localhost:3000/",
			view: "facilities-map",
			appVersion: "0.47.0",
		});

		expect(form.get("type")).toBe("bug");
		expect(form.get("message")).toBe("Broken legend");
		expect(form.getAll("images")).toHaveLength(2);
		expect(form.get("pageUrl")).toBe("http://localhost:3000/");
		expect(form.get("view")).toBe("facilities-map");
		expect(form.get("appVersion")).toBe("0.47.0");
	});

	it("leaves out the optional context when it is missing", () => {
		const form = toFeedbackFormData({ type: "improvement", message: "Idea", images: [] });

		expect(form.has("pageUrl")).toBe(false);
		expect(form.has("view")).toBe(false);
		expect(form.has("appVersion")).toBe(false);
		expect(form.getAll("images")).toEqual([]);
	});
});

describe("submitFeedback", () => {
	beforeEach(() => fitWithin.mockImplementation(async (files: File[]) => files));
	afterEach(() => vi.unstubAllGlobals());

	it("shrinks the images to the upload budget and posts a multipart form", async () => {
		const original = new File(["big"], "big.png", { type: "image/png" });
		const small = new File(["s"], "big.webp", { type: "image/webp" });
		fitWithin.mockResolvedValue([small]);
		const fetchMock = stubFetch(201, { data: { identifier: "DRY-1", url: "https://x/DRY-1" } });

		await expect(
			submitFeedback({ type: "bug", message: "x", images: [original] }),
		).resolves.toEqual({ identifier: "DRY-1", url: "https://x/DRY-1" });

		expect(fitWithin).toHaveBeenCalledWith([original], FEEDBACK_UPLOAD_BUDGET_BYTES);
		const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(path).toBe(FEEDBACK_ENDPOINT);
		expect(init).toMatchObject({ method: "POST", credentials: "include" });
		expect(init.headers).toBeUndefined();
		expect(((init.body as FormData).get("images") as File).name).toBe("big.webp");
	});

	it("refuses to send when the images are still over budget after compressing", async () => {
		const huge = new File(["x"], "huge.png", { type: "image/png" });
		Object.defineProperty(huge, "size", { value: FEEDBACK_UPLOAD_BUDGET_BYTES + 1 });
		fitWithin.mockResolvedValue([huge]);
		const fetchMock = stubFetch(201, { data: {} });

		await expect(
			submitFeedback({ type: "bug", message: "x", images: [huge] }),
		).rejects.toMatchObject({ status: 413, code: "PAYLOAD_TOO_LARGE" });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("throws the server error with its localized message", async () => {
		stubFetch(503, { error: { code: "FEEDBACK_NOT_CONFIGURED", message: "Not set up yet." } });

		await expect(submitFeedback({ type: "bug", message: "x", images: [] })).rejects.toMatchObject({
			status: 503,
			code: "FEEDBACK_NOT_CONFIGURED",
			message: "Not set up yet.",
		});
	});

	it("falls back to an unknown error for unreadable bodies", async () => {
		stubFetch(500, new Error("not json"));

		await expect(submitFeedback({ type: "bug", message: "x", images: [] })).rejects.toMatchObject({
			status: 500,
			code: "UNKNOWN_ERROR",
		});
	});
});

describe("useFeedbackSubmit", () => {
	beforeEach(() => fitWithin.mockImplementation(async (files: File[]) => files));
	afterEach(() => vi.unstubAllGlobals());

	it("returns the created ticket", async () => {
		stubFetch(201, { data: { identifier: "REQ-12", url: "https://linear.app/REQ-12" } });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFeedbackSubmit(), { wrapper: Wrapper });
		act(() => result.current.mutate({ type: "improvement", message: "Idea", images: [] }));

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ identifier: "REQ-12", url: "https://linear.app/REQ-12" });
	});
});
