import { act, createEvent, fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { Feedback } from "@/presentation/components/feedbacks/Feedback/FeedbackComponent";

vi.mock("@/infrastructure/auth/actions", () => ({ signOutOfApp: vi.fn() }));

const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
const revokeObjectURL = vi.fn();

function png(name = "shot.png", size = 3) {
	return new File(["x".repeat(size)], name, { type: "image/png" });
}

function renderWidget(ui: ReactElement = <Feedback />) {
	const { Wrapper } = createQueryWrapper();
	return renderWithMessages(<Wrapper>{ui}</Wrapper>);
}

function stubFetch(status: number, body: unknown) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: status < 400,
		status,
		json: async () => body,
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

function openForm(kind: "Suggest an improvement" | "Report a bug" = "Report a bug") {
	fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
	fireEvent.click(screen.getByRole("button", { name: new RegExp(kind) }));
	return screen.getByRole("textbox");
}

function endAnimation(element: Element) {
	fireEvent(element, new Event("webkitAnimationEnd", { bubbles: true }));
}

function finishClosing() {
	endAnimation(screen.getByRole("dialog"));
}

describe("Feedback", () => {
	it.each([true, false])(
		"shows the admin links only to admins and ends with sign-out and the version (%s)",
		(isAdmin) => {
			renderWidget(
				<Feedback user={{ name: "Stefano", email: "stefano@plei.com", image: null, isAdmin }} />,
			);
			fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
			const signOut = screen.getByRole("button", { name: "Sign out" });
			const footer = signOut.closest("form")?.parentElement;
			expect(footer?.lastElementChild).toBe(screen.getByTestId("app-version"));
			expect(footer?.lastElementChild?.previousElementSibling?.previousElementSibling).toBe(
				signOut.closest("form"),
			);
			const metrics = screen.queryByRole("link", { name: "App metrics" });
			const flags = screen.queryByRole("link", { name: "Feature flags" });
			if (isAdmin) {
				expect(metrics).toHaveAttribute("href", "/metrics");
				expect(flags).toHaveAttribute("href", "/feature-flags");
			} else {
				expect(metrics).not.toBeInTheDocument();
				expect(flags).not.toBeInTheDocument();
			}
		},
	);

	it("draws a 40px glass account control and opens the menu above it", () => {
		renderWidget(
			<Feedback
				user={{
					name: "Lucas Arena",
					email: "lucas@plei.com",
					image: null,
					isAdmin: false,
				}}
			/>,
		);

		const trigger = screen.getByRole("button", { name: "Account menu" });
		expect(trigger).not.toHaveTextContent("?");
		expect(trigger).toHaveClass(
			"map-icon-button",
			"map-glass",
			"size-[var(--map-profile-size)]",
			"rounded-full",
			"shadow-[var(--map-shadow)]",
		);
		expect(trigger.parentElement).toHaveClass(
			"fixed",
			"bottom-[var(--map-profile-bottom)]",
			"left-[var(--map-frame)]",
			"flex-col",
			"gap-[var(--map-profile-legend-gap)]",
		);
		expect(screen.getByTestId("profile-legend-slot").nextElementSibling).toBe(trigger);
		expect(screen.getByText("LA")).toHaveClass("size-[32px]", "bg-[#d1d5db]", "text-[#111827]");

		fireEvent.click(trigger);
		const dialog = screen.getByRole("dialog", { name: "Account menu" });
		expect(dialog).toHaveClass(
			"map-glass",
			"shadow-[var(--map-shadow)]",
			"bottom-[calc(var(--map-profile-size)+var(--map-profile-legend-gap))]",
			"z-50",
		);
		expect(dialog).toHaveTextContent("Lucas Arena");
		expect(dialog).toHaveTextContent("Suggest an improvement");
		expect(dialog).toHaveTextContent("Sign out");
		expect(screen.queryByRole("button", { name: "Send feedback" })).not.toBeInTheDocument();
	});
	beforeEach(() => {
		Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
		Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
		createObjectURL.mockClear();
		revokeObjectURL.mockClear();
	});

	it("shows a round help button and opens the type picker with a pop animation", () => {
		renderWidget();

		const trigger = screen.getByRole("button", { name: "Send feedback" });
		expect(trigger).toHaveTextContent("?");
		expect(trigger).toHaveClass("map-glass", "size-[var(--map-profile-size)]", "rounded-full");
		expect(trigger.parentElement).toHaveClass(
			"bottom-[var(--map-profile-bottom)]",
			"left-[var(--map-frame)]",
		);
		expect(trigger).not.toHaveClass("bottom-8", "left-3", "bg-pleiful-pitch-green-80");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		fireEvent.click(trigger);

		const dialog = screen.getByRole("dialog", { name: "Help us improve" });
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(dialog).toHaveClass("feedback-pop-in", "origin-bottom-left");
		expect(screen.getByRole("button", { name: /Suggest an improvement/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Report a bug/ })).toBeInTheDocument();
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
	});

	it("closes on Escape, an outside click, the close button and the trigger", () => {
		renderWidget();
		const trigger = screen.getByRole("button", { name: "Send feedback" });

		fireEvent.click(trigger);
		fireEvent.keyDown(window, { key: "Enter" });
		fireEvent.mouseDown(screen.getByRole("dialog"));
		expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
		fireEvent.keyDown(window, { key: "Escape" });
		expect(screen.getByRole("dialog")).toHaveClass("feedback-pop-out");
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		finishClosing();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		fireEvent.click(trigger);
		fireEvent.mouseDown(document.body);
		finishClosing();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		fireEvent.click(trigger);
		fireEvent.click(screen.getByRole("button", { name: "Close feedback" }));
		finishClosing();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		fireEvent.click(trigger);
		fireEvent.click(trigger);
		expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "closing");
		fireEvent.click(trigger);
		expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
	});

	it("ignores animations that are not the panel closing", () => {
		renderWidget();
		fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

		finishClosing();
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		fireEvent.keyDown(window, { key: "Escape" });
		endAnimation(screen.getByRole("button", { name: /Report a bug/ }));
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("shows the form for the chosen type and can go back to the picker", () => {
		renderWidget();

		const textarea = openForm("Suggest an improvement");

		expect(textarea).toHaveFocus();
		expect(textarea).toBeRequired();
		expect(textarea).toHaveAttribute("maxLength", "5000");
		expect(textarea).toHaveAttribute(
			"placeholder",
			"What would you like to see? The more detail, the better.",
		);
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
		fireEvent.change(textarea, { target: { value: "   " } });
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
		fireEvent.change(textarea, { target: { value: "Add filters" } });
		expect(screen.getByText("11/5000")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: /Back/ }));
		expect(screen.getByRole("button", { name: /Report a bug/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /Report a bug/ }));
		expect(screen.getByRole("textbox")).toHaveValue("Add filters");
		expect(screen.getByRole("textbox")).toHaveAttribute(
			"placeholder",
			"What happened, and what did you expect to happen instead?",
		);
	});

	it("attaches images from the picker, drag and drop and the clipboard, with thumbnails", () => {
		renderWidget();
		openForm();
		const input = screen.getByTestId("feedback-file-input") as HTMLInputElement;
		const click = vi.spyOn(input, "click");

		fireEvent.click(screen.getByRole("button", { name: "Add images" }));
		expect(click).toHaveBeenCalled();
		expect(input).toHaveAttribute("accept", "image/png,image/jpeg,image/webp,image/gif");

		fireEvent.change(input, { target: { files: [png("one.png")] } });
		fireEvent.change(input, { target: { files: null } });

		const dropzone = screen.getByTestId("feedback-dropzone");
		const form = screen.getByTestId("feedback-form");
		fireEvent.dragOver(form);
		expect(dropzone).toHaveAttribute("data-dragging", "true");
		expect(screen.getByText("Drop images here")).toBeInTheDocument();
		const leaveIntoChild = createEvent.dragLeave(form);
		Object.defineProperty(leaveIntoChild, "relatedTarget", { value: dropzone });
		fireEvent(form, leaveIntoChild);
		expect(dropzone).toHaveAttribute("data-dragging", "true");
		fireEvent.dragLeave(form);
		expect(dropzone).toHaveAttribute("data-dragging", "false");
		fireEvent.dragOver(form);
		fireEvent.drop(form, { dataTransfer: { files: [png("two.png")] } });
		expect(dropzone).toHaveAttribute("data-dragging", "false");
		fireEvent.drop(form, {});

		fireEvent.paste(screen.getByRole("textbox"), {
			clipboardData: {
				items: [
					{ kind: "string", getAsFile: () => null },
					{ kind: "file", getAsFile: () => null },
					{ kind: "file", getAsFile: () => png("three.png") },
				],
			},
		});
		fireEvent.paste(screen.getByRole("textbox"), { clipboardData: { items: [] } });
		fireEvent.paste(screen.getByRole("textbox"), {});

		const thumbnails = screen.getAllByTestId("feedback-thumbnail");
		expect(thumbnails.map((thumbnail) => thumbnail.getAttribute("aria-label"))).toEqual([
			"one.png",
			"two.png",
			"three.png",
		]);
		expect(thumbnails[0]).toHaveStyle({ backgroundImage: 'url("blob:one.png")' });

		fireEvent.click(screen.getByRole("button", { name: "Remove two.png" }));
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:two.png");
		expect(screen.getAllByTestId("feedback-thumbnail")).toHaveLength(2);
	});

	it("rejects unsupported, oversized and extra images with a notice", () => {
		renderWidget();
		openForm();
		const input = screen.getByTestId("feedback-file-input");

		fireEvent.change(input, {
			target: { files: [new File(["pdf"], "doc.pdf", { type: "application/pdf" })] },
		});
		expect(screen.getByText("doc.pdf isn't a PNG, JPG, WebP or GIF image.")).toBeInTheDocument();

		const big = png("big.png");
		Object.defineProperty(big, "size", { value: 10 * 1024 * 1024 + 1 });
		fireEvent.change(input, { target: { files: [big] } });
		expect(screen.getByText("big.png is larger than 10 MB.")).toBeInTheDocument();

		fireEvent.change(input, {
			target: { files: ["a", "b", "c", "d", "e", "f"].map((name) => png(`${name}.png`)) },
		});
		expect(screen.getByText("You can attach up to 5 images.")).toBeInTheDocument();
		expect(screen.getAllByTestId("feedback-thumbnail")).toHaveLength(5);
		expect(screen.getByRole("button", { name: "Add images" })).toBeDisabled();

		fireEvent.change(input, { target: { files: [png("g.png")] } });
		expect(screen.getAllByTestId("feedback-thumbnail")).toHaveLength(5);
	});

	it("submits the feedback and shows the Linear ticket", async () => {
		vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "0.47.0");
		let respond: (value: unknown) => void = () => undefined;
		const fetchMock = vi.fn(
			() =>
				new Promise((resolve) => {
					respond = resolve;
				}),
		);
		vi.stubGlobal("fetch", fetchMock);
		renderWidget(<Feedback facilityId="889" />);
		const textarea = openForm();
		fireEvent.change(textarea, { target: { value: "  Legend overlaps the map  " } });
		fireEvent.change(screen.getByTestId("feedback-file-input"), {
			target: { files: [png("bug.png")] },
		});

		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("button", { name: "Sending…" })).toBeDisabled();
		act(() =>
			respond({
				ok: true,
				status: 201,
				json: async () => ({
					data: { identifier: "ENG-42", url: "https://linear.app/plei/issue/ENG-42" },
				}),
			}),
		);
		const link = await screen.findByRole("link", { name: "ENG-42" });
		expect(link).toHaveAttribute("href", "https://linear.app/plei/issue/ENG-42");
		expect(screen.getByRole("status")).toHaveTextContent("Thanks, we got it!");
		const [path, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(path).toBe("/api/v1/feedback");
		const body = init.body as FormData;
		expect(body.get("type")).toBe("bug");
		expect(body.get("message")).toBe("Legend overlaps the map");
		expect((body.get("images") as File).name).toBe("bug.png");
		expect(body.get("pageUrl")).toBe(window.location.href);
		expect(body.get("view")).toBe("facilities-map (facility 889)");
		expect(body.get("appVersion")).toBe("0.47.0");

		fireEvent.keyDown(window, { key: "Escape" });
		finishClosing();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:bug.png");
		fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
		expect(screen.getByRole("button", { name: /Report a bug/ })).toBeInTheDocument();
	});

	it("starts over from the success state", async () => {
		stubFetch(201, { data: { identifier: "REQ-7", url: "https://linear.app/REQ-7" } });
		renderWidget();
		fireEvent.change(openForm("Suggest an improvement"), { target: { value: "Idea" } });
		fireEvent.submit(screen.getByTestId("feedback-form"));

		fireEvent.click(await screen.findByRole("button", { name: "Send more feedback" }));

		expect(screen.getByRole("button", { name: /Suggest an improvement/ })).toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("does not submit an empty message", () => {
		const fetchMock = stubFetch(201, { data: {} });
		renderWidget();
		openForm();

		fireEvent.submit(screen.getByTestId("feedback-form"));

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("shows the localized server message for a 400 and keeps the draft", async () => {
		stubFetch(400, { error: { code: "VALIDATION_ERROR", message: "The request is invalid." } });
		renderWidget();
		fireEvent.change(openForm(), { target: { value: "It broke" } });

		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("The request is invalid.");
		expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
		expect(screen.getByRole("textbox")).toHaveValue("It broke");
		expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
	});

	it("offers a retry when Linear fails with a 502", async () => {
		const fetchMock = stubFetch(502, {
			error: { code: "ISSUE_TRACKER_FAILED", message: "Could not reach Linear." },
		});
		renderWidget();
		fireEvent.change(openForm(), { target: { value: "It broke" } });
		fireEvent.click(screen.getByRole("button", { name: "Send" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach Linear.");

		fetchMock.mockResolvedValue({
			ok: true,
			status: 201,
			json: async () => ({ data: { identifier: "ENG-9", url: "https://linear.app/ENG-9" } }),
		});
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));

		expect(await screen.findByRole("link", { name: "ENG-9" })).toBeInTheDocument();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("explains that feedback is not set up on a 503 and does not offer a retry", async () => {
		stubFetch(503, {
			error: { code: "FEEDBACK_NOT_CONFIGURED", message: "Feedback is not set up yet." },
		});
		renderWidget();
		fireEvent.change(openForm(), { target: { value: "It broke" } });

		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Feedback is not set up yet.");
		expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
	});

	it("shows the server's 413 message without a retry and blocks sending", async () => {
		stubFetch(413, {
			error: { code: "PAYLOAD_TOO_LARGE", message: "Your feedback is too large to send." },
		});
		renderWidget();
		fireEvent.change(openForm(), { target: { value: "It broke" } });

		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Your feedback is too large to send.",
		);
		expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
	});

	it.each([
		[503, "Feedback isn't switched on here yet."],
		[502, "We couldn't reach Linear just now."],
		[400, "Something in the form doesn't look right."],
		[500, "Something went wrong while sending."],
	])("uses friendly copy for a %i without a readable body", async (status, copy) => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status,
				json: async () => {
					throw new Error("not json");
				},
			}),
		);
		renderWidget();
		fireEvent.change(openForm(), { target: { value: "It broke" } });

		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(copy);
	});

	it("shows the generic error when the network fails", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
		renderWidget();
		fireEvent.change(openForm(), { target: { value: "It broke" } });

		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong while sending."),
		);
		expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
	});

	it("blocks sending when the screenshots stay too large after compressing", async () => {
		const fetchMock = stubFetch(201, { data: {} });
		renderWidget();
		fireEvent.change(openForm(), { target: { value: "Big screenshots" } });
		const files = ["a", "b", "c", "d"].map((name) => {
			const image = png(`${name}.png`);
			Object.defineProperty(image, "size", { value: 1100 * 1000 });
			return image;
		});
		const input = screen.getByTestId("feedback-file-input");
		fireEvent.change(input, { target: { files } });

		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Your screenshots are still too large to send after compressing.",
		);
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
		expect(fetchMock).not.toHaveBeenCalled();

		fireEvent.change(input, { target: { files: [png("small.png")] } });
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: "Send" }));
		expect(await screen.findByRole("alert")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Remove a.png" }));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("releases thumbnail URLs when it unmounts", () => {
		const { unmount } = renderWidget();
		openForm();
		fireEvent.change(screen.getByTestId("feedback-file-input"), {
			target: { files: [png("keep.png")] },
		});

		act(() => unmount());

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:keep.png");
	});
});
