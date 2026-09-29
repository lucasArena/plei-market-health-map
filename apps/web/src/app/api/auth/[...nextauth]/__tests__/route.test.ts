vi.mock("@/infrastructure/auth/auth", () => ({
	handlers: { GET: "get-handler", POST: "post-handler" },
}));

describe("auth route", () => {
	it("exposes the Auth.js handlers", async () => {
		const route = await import("@/app/api/auth/[...nextauth]/route");
		expect(route.GET).toBe("get-handler");
		expect(route.POST).toBe("post-handler");
	});
});
