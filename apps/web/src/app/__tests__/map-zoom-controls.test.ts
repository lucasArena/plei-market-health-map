import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const zoomCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("map zoom controls", () => {
	it("holds both zoom buttons in one 32 by 64 rounded glass container", () => {
		const group = zoomCss.slice(
			zoomCss.indexOf(".map-frame .maplibregl-ctrl.maplibregl-ctrl-group"),
			zoomCss.indexOf(".map-frame .maplibregl-ctrl-group button {"),
		);
		const button = zoomCss.slice(
			zoomCss.indexOf(".map-frame .maplibregl-ctrl-group button {"),
			zoomCss.indexOf(".map-frame .maplibregl-ctrl-group button + button"),
		);

		expect(group).toContain("width: 32px;");
		expect(group).toContain("height: 64px;");
		expect(group).toContain("border-radius: 9999px;");
		expect(group).toContain("background-color: var(--map-glass);");
		expect(group).toContain("box-shadow: var(--map-shadow), inset 0 0 0 1px var(--border);");
		expect(button).toContain("flex: 0 0 32px;");
		expect(button).toContain("width: 32px;");
		expect(button).toContain("height: 32px;");
		expect(button).toContain("border-radius: 0;");
		expect(button).toContain("background: transparent;");
		expect(button).toContain("box-shadow: none;");
		expect(button).toContain("cursor: pointer;");
		expect(zoomCss).toContain("margin-top: 0;");
		expect(zoomCss).toContain("--map-icon-hover: var(--muted);");
		expect(zoomCss).toContain(
			"--map-icon-active: color-mix(in oklch, var(--accent) 60%, transparent);",
		);
		const interaction = zoomCss.slice(
			zoomCss.indexOf("button.map-icon-button:hover"),
			zoomCss.indexOf(".map-frame .maplibregl-ctrl.maplibregl-ctrl-group"),
		);
		expect(interaction).toContain(".map-frame .maplibregl-ctrl-group button:hover");
		expect(interaction).toContain(".map-frame .maplibregl-ctrl-group button:active");
		expect(interaction).toContain('button.map-icon-button[aria-expanded="true"]');
		expect(interaction).toContain("background-color: var(--map-icon-hover);");
		expect(interaction).toContain("background-color: var(--map-icon-active);");
		expect(interaction).not.toContain("var(--muted)");
		expect(interaction).not.toContain("color-mix");
	});
});
