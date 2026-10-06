import {
	PHOTON_PLACE_LAYERS,
	PHOTON_SEARCH_URL,
	PHOTON_USER_AGENT,
	PhotonPlaceSearch,
	toPlaceView,
} from "@server/infrastructure/providers/photon/photon-place-search/photon-place-search";

const WICHITA = {
	geometry: { coordinates: [-97.3375, 37.6922] },
	properties: {
		osm_id: 123,
		osm_type: "R",
		name: "Wichita",
		type: "city",
		state: "Kansas",
		country: "United States",
		extent: [-97.73, 37.84, -97.15, 37.48],
	},
};

describe("toPlaceView", () => {
	it("keeps the name, a short context and the bounds as west, south, east, north", () => {
		expect(toPlaceView(WICHITA as never)).toEqual({
			id: "R123",
			name: "Wichita",
			kind: "city",
			context: "Kansas, United States",
			location: { latitude: 37.6922, longitude: -97.3375 },
			bounds: [-97.73, 37.48, -97.15, 37.84],
		});
	});

	it("drops nameless results and repeats of the name in the context", () => {
		expect(
			toPlaceView({ ...WICHITA, properties: { osm_id: 1, osm_type: "N" } } as never),
		).toBeNull();
		expect(
			toPlaceView({
				geometry: WICHITA.geometry,
				properties: {
					osm_id: 2,
					osm_type: "R",
					name: "Kansas",
					type: "state",
					state: "Kansas",
					country: "United States",
				},
			} as never),
		).toMatchObject({ kind: "state", context: "United States", bounds: null });
	});
});

describe("PhotonPlaceSearch", () => {
	it("asks Photon for places only, identifies itself and maps the results", async () => {
		const fetch = vi.fn().mockResolvedValue(
			Response.json({
				features: [WICHITA, { ...WICHITA, properties: { osm_id: 9, osm_type: "N" } }],
			}),
		);

		const places = await new PhotonPlaceSearch({ fetch }).search("wichita", 5);

		expect(places.map((place) => place.name)).toEqual(["Wichita"]);
		const [url, init] = fetch.mock.calls[0] ?? [];
		expect(String(url)).toContain(PHOTON_SEARCH_URL);
		expect(url.searchParams.get("q")).toBe("wichita");
		expect(url.searchParams.get("limit")).toBe("5");
		expect(url.searchParams.getAll("layer")).toEqual(PHOTON_PLACE_LAYERS);
		expect(init.headers["User-Agent"]).toBe(PHOTON_USER_AGENT);
	});

	it("fails on an error status and uses the global fetch by default", async () => {
		const failing = new PhotonPlaceSearch({
			fetch: vi.fn().mockResolvedValue(new Response("busy", { status: 503 })),
		});
		await expect(failing.search("london", 5)).rejects.toThrow("Photon responded with 503.");

		const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ features: [] }));
		await expect(new PhotonPlaceSearch().search("london", 5)).resolves.toEqual([]);
		spy.mockRestore();
	});
});
