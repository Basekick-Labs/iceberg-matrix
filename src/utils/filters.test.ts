import { describe, expect, it } from "vitest";
import { data } from "../data/load-data";
import type { FilterState } from "../types";
import { applyFilters } from "./filters";

describe("support-level filtering", () => {
  it("ignores ratings for spec versions where a feature cannot be written", () => {
    const filters: FilterState = {
      selectedVersions: ["v2", "v3"],
      compareMode: false,
      selectedPlatforms: ["daft"],
      selectedCategories: [],
      selectedSupportLevels: ["unknown"],
      searchQuery: "",
    };

    // Daft's V3 position-delete entry is unknown, but V3 forbids writing
    // position delete files. Its applicable V2 entry is rated none.
    const ids = applyFilters(data, filters).features.map((feature) => feature.id);
    expect(ids).not.toContain("position-deletes");
    expect(ids).toContain("bloom-filters");
  });
});

describe("search", () => {
  const base: FilterState = {
    selectedVersions: ["v2", "v3"],
    compareMode: false,
    selectedPlatforms: [],
    selectedCategories: [],
    selectedSupportLevels: [],
    searchQuery: "",
  };
  const search = (searchQuery: string, extra: Partial<FilterState> = {}) =>
    applyFilters(data, { ...base, ...extra, searchQuery });
  const all = applyFilters(data, base);

  it("narrows to the matching engines and keeps every feature row", () => {
    const { platforms, features } = search("duckdb");
    expect(platforms.map((p) => p.id)).toEqual(["duckdb"]);
    expect(features.map((f) => f.id)).toEqual(all.features.map((f) => f.id));
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(search("  DuckDB ").platforms.map((p) => p.id)).toEqual(["duckdb"]);
  });

  it("matches on vendor, so one word finds a whole vendor's engines", () => {
    const ids = search("aws").platforms.map((p) => p.id);
    expect(ids.length).toBeGreaterThan(1);
    expect(ids).toContain("aws-athena");
    expect(ids).not.toContain("duckdb");
  });

  it("keeps every variant of a multi-variant engine", () => {
    // Spark, Spark + Gluten and Spark + Comet share a column group.
    const ids = search("spark").platforms.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["spark", "spark-gluten", "spark-comet"]));
  });

  it("falls back to filtering feature rows when no engine matches", () => {
    const { platforms, features } = search("bloom");
    expect(platforms).toHaveLength(all.platforms.length);
    expect(features.map((f) => f.id)).toEqual(["bloom-filters"]);
  });

  it("prefers the engine when a word names both an engine and a feature", () => {
    // "snowflake" is the engine and part of "Snowflake Horizon Catalog".
    const { platforms, features } = search("snowflake");
    expect(platforms.map((p) => p.id)).toEqual(["snowflake"]);
    expect(features.map((f) => f.id)).toContain("snowflake-horizon-catalog");
    // The row stays reachable by a word that is not an engine name.
    expect(search("horizon").features.map((f) => f.id)).toEqual(["snowflake-horizon-catalog"]);
  });

  it("only searches within engines the platform chips already selected", () => {
    // DuckDB is not selected, so a "duckdb" search finds no engine among the
    // selected ones and falls through to the feature filter (which matches none).
    const { platforms, features } = search("duckdb", { selectedPlatforms: ["daft", "pyiceberg"] });
    expect(platforms.map((p) => p.id)).toEqual(["daft", "pyiceberg"]);
    expect(features).toEqual([]);
  });

  it("returns nothing when the text matches neither an engine nor a feature", () => {
    const { platforms, features } = search("zzz-nothing");
    expect(features).toEqual([]);
    expect(platforms).toHaveLength(all.platforms.length);
  });
});
