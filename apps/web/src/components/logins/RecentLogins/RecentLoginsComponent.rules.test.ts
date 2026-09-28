import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagesProvider } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	resolveStatus,
	toRecentLoginRows,
	useRecentLoginsRules,
} from "@/components/logins/RecentLogins/RecentLoginsComponent.rules";
import { EN_MESSAGES } from "@/test/messages";

const mockUseRecentLogins = vi.fn();

vi.mock("@/lib/api/use-recent-logins", () => ({
	useRecentLogins: (limit: number) => mockUseRecentLogins(limit),
}));

const LOGIN = {
	id: "1",
	userId: "user_1",
	email: "dev@plei.com",
	signedInAt: "2026-09-28T10:00:00.000Z",
};

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("toRecentLoginRows", () => {
	it("adds a localized sign-in label", () => {
		const [row] = toRecentLoginRows([LOGIN], "en");
		expect(row?.email).toBe("dev@plei.com");
		expect(row?.signedInLabel).toContain("2026");
	});
});

describe("resolveStatus", () => {
	it("prioritizes loading, then error, then empty", () => {
		expect(resolveStatus(true, true, 0)).toBe("loading");
		expect(resolveStatus(false, true, 0)).toBe("error");
		expect(resolveStatus(false, false, 0)).toBe("empty");
		expect(resolveStatus(false, false, 2)).toBe("ready");
	});
});

describe("useRecentLoginsRules", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns ready rows with the default limit", () => {
		mockUseRecentLogins.mockReturnValue({ data: [LOGIN], isPending: false, isError: false });

		const { result } = renderHook(() => useRecentLoginsRules({}), { wrapper });

		expect(mockUseRecentLogins).toHaveBeenCalledWith(10);
		expect(result.current.status).toBe("ready");
		expect(result.current.rows).toHaveLength(1);
		expect(result.current.messages).toBe(EN_MESSAGES.logins);
	});

	it("is loading before data arrives", () => {
		mockUseRecentLogins.mockReturnValue({ data: undefined, isPending: true, isError: false });

		const { result } = renderHook(() => useRecentLoginsRules({ limit: 3 }), { wrapper });

		expect(mockUseRecentLogins).toHaveBeenCalledWith(3);
		expect(result.current.status).toBe("loading");
	});
});
