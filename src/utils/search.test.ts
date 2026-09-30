import { GITagItem } from "../models/Items";
import { Place } from "../models/Places";
import { buildSearchIndex, highlightMatch, searchIndex } from "./search";

const { describe, it, expect } = globalThis as typeof globalThis & {
  describe: (name: string, run: () => void) => void;
  it: (name: string, run: () => void) => void;
  expect: (actual: unknown) => {
    toEqual: (expected: unknown) => void;
    toHaveLength: (expected: number) => void;
  };
};

const makePlace = (name: string, overrides: Partial<Place> = {}): Place => ({
  name,
  type: "Historical / Heritage Sites",
  country: "India",
  state: "Goa",
  city: "Panaji",
  coordinates: { lat: 15.49, long: 73.82 },
  ...overrides,
});

const makeGiTag = (
  name: string,
  overrides: Partial<GITagItem> = {},
): GITagItem => ({
  name,
  Type: "Agriculture",
  country: "India",
  state: "Goa",
  location: "Panaji",
  coordinates: { lat: 15.5, long: 73.83 },
  significance: "Local specialty",
  ...overrides,
});

describe("searchIndex", () => {
  it("matches case-insensitively and ignores diacritics", () => {
    const index = buildSearchIndex([makePlace("Águada Fort")], []);

    expect(searchIndex(index, "AGUADA").map((entry) => entry.name)).toEqual([
      "Águada Fort",
    ]);
  });

  it("ranks name prefixes before contains, location, type, and description", () => {
    const places = [
      makePlace("Fort", {
        state: "Karnataka",
        city: "Udupi",
        description: "A harbor landmark",
      }),
      makePlace("Old Harbor Fort", { state: "Karnataka", city: "Udupi" }),
      makePlace("Harbor Point", { state: "Karnataka", city: "Udupi" }),
      makePlace("State Palace", {
        state: "Harbor State",
        city: "Udupi",
      }),
      makePlace("City Palace", {
        state: "Karnataka",
        city: "Harbor City",
      }),
      makePlace("Temple", {
        state: "Karnataka",
        city: "Udupi",
        type: "Harbor attractions",
      }),
    ];

    expect(
      searchIndex(buildSearchIndex(places, []), "harbor").map(
        (entry) => entry.name,
      ),
    ).toEqual([
      "Harbor Point",
      "Old Harbor Fort",
      "State Palace",
      "City Palace",
      "Temple",
      "Fort",
    ]);
  });

  it("excludes entries with zero coordinates", () => {
    const places = [
      makePlace("Placeholder", { coordinates: { lat: 0, long: 0 } }),
      makePlace("Valid", { coordinates: { lat: 1, long: 1 } }),
    ];

    expect(buildSearchIndex(places, []).map((entry) => entry.name)).toEqual([
      "Valid",
    ]);
  });

  it("limits the number of results", () => {
    const places = Array.from({ length: 10 }, (_, index) =>
      makePlace(`Goa Place ${index}`),
    );

    expect(searchIndex(buildSearchIndex(places, []), "goa", 8)).toHaveLength(8);
  });

  it("returns no results for empty and whitespace-only queries", () => {
    const index = buildSearchIndex([makePlace("Goa Fort")], []);

    expect(searchIndex(index, "")).toEqual([]);
    expect(searchIndex(index, "   ")).toEqual([]);
  });

  it("includes both places and GI tags", () => {
    const index = buildSearchIndex(
      [makePlace("Goa Fort")],
      [makeGiTag("Goa Cashew")],
    );

    expect(searchIndex(index, "goa").map((entry) => entry.kind)).toEqual([
      "place",
      "gi",
    ]);
  });

  it("deduplicates entries with the same stable ID", () => {
    const place = makePlace("Repeated Place");

    expect(buildSearchIndex([place, { ...place }], [])).toHaveLength(1);
  });

  it("highlights a match without losing diacritic-bearing source text", () => {
    expect(highlightMatch("Águada Fort", "agu")).toEqual([
      { text: "Águ", match: true },
      { text: "ada Fort", match: false },
    ]);
  });
});
