import { act, render, renderHook } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { AppProviders } from "@/presentation/components/providers/AppProviders/AppProvidersComponent";
import {
	SYSTEM_THEME_QUERY,
	systemPrefersDark,
	useSystemTheme,
} from "@/presentation/hooks/use-theme/use-system-theme";

describe("system theme", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		document.documentElement.classList.remove("dark");
	});

	function media(dark: boolean) {
		const query = new EventTarget();
		Object.assign(query, { matches: dark });
		const matchMedia = vi.fn(() => query);
		vi.stubGlobal("matchMedia", matchMedia);
		return {
			query,
			matchMedia,
			change: (matches: boolean) =>
				act(() => {
					Object.assign(query, { matches });
					query.dispatchEvent(new Event("change"));
				}),
		};
	}

	it("reads the system preference and follows changes", () => {
		const { change, matchMedia } = media(true);
		const { result, unmount } = renderHook(useSystemTheme);
		expect(result.current).toBe(true);
		expect(matchMedia).toHaveBeenCalledWith(SYSTEM_THEME_QUERY);
		change(false);
		expect(result.current).toBe(false);
		change(true);
		expect(result.current).toBe(true);
		unmount();
		change(false);
	});

	it("applies the system theme to the entire app", () => {
		const { change } = media(true);
		render(
			<AppProviders locale="en" messages={EN_MESSAGES}>
				<span>content</span>
			</AppProviders>,
		);
		expect(document.documentElement).toHaveClass("dark");
		change(false);
		expect(document.documentElement).not.toHaveClass("dark");
		change(true);
		expect(document.documentElement).toHaveClass("dark");
	});

	it("falls back to light when matchMedia is unavailable", () => {
		vi.stubGlobal("matchMedia", undefined);
		const { result } = renderHook(useSystemTheme);
		expect(systemPrefersDark()).toBe(false);
		expect(result.current).toBe(false);
	});
});
