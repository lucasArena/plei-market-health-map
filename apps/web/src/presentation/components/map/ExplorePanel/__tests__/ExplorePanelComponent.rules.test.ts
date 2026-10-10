import { animateExplorePanelResize } from "@/presentation/components/map/ExplorePanel/ExplorePanelComponent.rules";
import {
	DRILL_DOWN_RESIZE_EASING,
	DRILL_DOWN_RESIZE_MS,
} from "@/presentation/components/map/ExplorePanel/ExplorePanelComponent.styles";
import type { PanelBox } from "@/presentation/components/map/ExplorePanel/ExplorePanelComponent.types";

const from: PanelBox = { top: 40, left: 600, width: 448, height: 500, radius: "12px" };

afterEach(() => vi.restoreAllMocks());

function panelWithAnimation() {
	const panel = document.createElement("aside");
	panel.style.borderRadius = "0px";
	vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
		top: 0,
		left: 0,
		width: 1200,
		height: 800,
		bottom: 800,
		right: 1200,
		x: 0,
		y: 0,
		toJSON: () => ({}),
	});
	const animate = vi.fn();
	Object.defineProperty(panel, "animate", { value: animate });
	return { panel, animate };
}

describe("animateExplorePanelResize", () => {
	it("supports browsers without the animation API", () => {
		expect(() => animateExplorePanelResize(document.createElement("aside"), from)).not.toThrow();
	});

	it("animates the actual bounds and corners when expanding", () => {
		const { panel, animate } = panelWithAnimation();
		animateExplorePanelResize(panel, from);
		expect(animate).toHaveBeenCalledWith(
			[
				{
					top: "40px",
					left: "600px",
					width: "448px",
					height: "500px",
					borderRadius: "12px",
					right: "auto",
					bottom: "auto",
					maxHeight: "none",
				},
				{
					top: "0px",
					left: "0px",
					width: "1200px",
					height: "800px",
					borderRadius: "0px",
					right: "auto",
					bottom: "auto",
					maxHeight: "none",
				},
			],
			{
				id: "explore-panel-resize",
				duration: DRILL_DOWN_RESIZE_MS,
				easing: DRILL_DOWN_RESIZE_EASING,
			},
		);
	});

	it("cancels a previous resize without cancelling other animations", () => {
		const { panel, animate } = panelWithAnimation();
		const cancelResize = vi.fn();
		const cancelOther = vi.fn();
		Object.defineProperty(panel, "getAnimations", {
			value: () => [
				{ id: "explore-panel-resize", cancel: cancelResize },
				{ id: "panel-slide-in", cancel: cancelOther },
			],
		});
		animateExplorePanelResize(panel, from);
		expect(cancelResize).toHaveBeenCalledOnce();
		expect(cancelOther).not.toHaveBeenCalled();
		expect(animate).toHaveBeenCalledOnce();
	});

	it("skips motion for reduced-motion users", () => {
		const { panel, animate } = panelWithAnimation();
		Object.defineProperty(window, "matchMedia", {
			configurable: true,
			value: vi.fn(() => ({ matches: true })),
		});
		animateExplorePanelResize(panel, from);
		expect(animate).not.toHaveBeenCalled();
		Reflect.deleteProperty(window, "matchMedia");
	});

	it("skips a resize when the bounds are unchanged", () => {
		const { panel, animate } = panelWithAnimation();
		animateExplorePanelResize(panel, { top: 0, left: 0, width: 1200, height: 800, radius: "0px" });
		expect(animate).not.toHaveBeenCalled();
	});
});
