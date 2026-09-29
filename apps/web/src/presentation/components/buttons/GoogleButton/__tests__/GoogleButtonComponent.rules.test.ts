import { renderHook } from "@testing-library/react";
import { useGoogleButtonRules } from "@/presentation/components/buttons/GoogleButton/GoogleButtonComponent.rules";

const mockFormStatus = vi.fn(() => ({ pending: false }));

vi.mock("react-dom", async (importOriginal) => ({
	...(await importOriginal<object>()),
	useFormStatus: () => mockFormStatus(),
}));

const PROPS = { label: "Continue with Google", pendingLabel: "Redirecting…" };

describe("useGoogleButtonRules", () => {
	it("shows the label while idle", () => {
		const { result } = renderHook(() => useGoogleButtonRules(PROPS));

		expect(result.current).toEqual({ isPending: false, text: "Continue with Google" });
	});

	it("shows the pending label while the form submits", () => {
		mockFormStatus.mockReturnValueOnce({ pending: true });
		const { result } = renderHook(() => useGoogleButtonRules(PROPS));

		expect(result.current).toEqual({ isPending: true, text: "Redirecting…" });
	});
});
