import { NotFoundError, UnauthorizedError } from "@market-health-map/application";
import { GET } from "@/app/api/v1/facilities/[facilityId]/route";

const mockRequireUser = vi.fn();
const mockGetFacilityDetail = vi.fn();

vi.mock("@/server/api/authenticate", () => ({ requireUser: () => mockRequireUser() }));
vi.mock("@/server/container", () => ({
	getContainer: () => ({ getFacilityDetail: mockGetFacilityDetail }),
}));

function call(facilityId: string) {
	return GET(new Request(`http://localhost/api/v1/facilities/${facilityId}`), {
		params: Promise.resolve({ facilityId }),
	});
}

describe("GET /api/v1/facilities/[facilityId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRequireUser.mockResolvedValue({ userId: "g-1", email: "lucas@plei.com" });
	});

	it("returns the facility detail", async () => {
		mockGetFacilityDetail.mockResolvedValue({ facility: { id: "889" }, stats: {} });

		const response = await call("889");

		expect(response.status).toBe(200);
		expect(mockGetFacilityDetail).toHaveBeenCalledWith({ facilityId: "889" });
		expect((await response.json()).data.facility.id).toBe("889");
	});

	it("returns 404 for an unknown facility", async () => {
		mockGetFacilityDetail.mockRejectedValue(new NotFoundError("Facility"));
		expect((await call("missing")).status).toBe(404);
	});

	it("rejects anonymous requests", async () => {
		mockRequireUser.mockRejectedValue(new UnauthorizedError());
		expect((await call("889")).status).toBe(401);
		expect(mockGetFacilityDetail).not.toHaveBeenCalled();
	});
});
