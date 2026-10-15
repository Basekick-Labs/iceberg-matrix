import type {
  CompatibilityData,
  Feature,
  FilterState,
  Platform,
} from "../types";
import { getSupportEntry } from "./support";
import { applicableVersions } from "./versions";

/** Whether a search string (already trimmed and lower-cased) names this engine. */
export function platformMatchesQuery(platform: Platform, query: string): boolean {
  return [platform.name, platform.variantLabel, platform.vendor, platform.id].some(
    (field) => field?.toLowerCase().includes(query),
  );
}

/** Whether a search string (already trimmed and lower-cased) names this feature. */
export function featureMatchesQuery(feature: Feature, query: string): boolean {
  return feature.name.toLowerCase().includes(query);
}

export function applyFilters(
  data: CompatibilityData,
  filters: FilterState
): { platforms: Platform[]; features: Feature[] } {
  let platforms = data.platforms;
  let features = data.features;

  // Filter platforms by selected IDs
  if (filters.selectedPlatforms.length > 0) {
    const ids = new Set(filters.selectedPlatforms);
    platforms = platforms.filter((p) => ids.has(p.id));
  }

  // Keep a feature only when it applies to at least one selected version. This
  // honours the full version model (introducedIn, plus the optional
  // availableVersions / removedIn bounds), so a feature that does not exist in
  // any selected version is hidden — e.g. a v3-only feature with only v2
  // selected, or (once v4 lands) a V2/V3-only feature with only v4 selected.
  const selected = new Set(filters.selectedVersions);
  features = features.filter((f) =>
    applicableVersions(f, data.versions).some((v) => selected.has(v)),
  );

  // Filter features by selected categories
  if (filters.selectedCategories.length > 0) {
    const cats = new Set(filters.selectedCategories);
    features = features.filter((f) => cats.has(f.category));
  }

  // Search box: finds engines as well as features. If the text matches any
  // engine, only those columns are kept (and every feature row stays), so typing
  // "spark" or "aws" takes you to that engine. Otherwise it filters the feature
  // rows by name, as before. Engines win a tie on purpose: "snowflake" matches
  // both the Snowflake engine and the "Snowflake Horizon Catalog" row, and
  // intersecting the two would leave a single cell, which is never what typing
  // an engine name means. The row stays reachable by typing "horizon".
  if (filters.searchQuery.trim() !== "") {
    const query = filters.searchQuery.trim().toLowerCase();
    const matchingPlatforms = platforms.filter((p) => platformMatchesQuery(p, query));
    if (matchingPlatforms.length > 0) {
      platforms = matchingPlatforms;
    } else {
      features = features.filter((f) => featureMatchesQuery(f, query));
    }
  }

  // Filter features by support level: keep a row when at least one of its
  // visible cells (kept platform × selected version) has a selected level.
  // Missing entries render as "unknown" in the grid, so they match here too.
  if (filters.selectedSupportLevels.length > 0) {
    const levels = new Set(filters.selectedSupportLevels);
    const keptPlatforms = platforms;
    features = features.filter((f) =>
      keptPlatforms.some((p) =>
        applicableVersions(f, data.versions).some((v) =>
          selected.has(v) &&
          levels.has(getSupportEntry(data, p.id, f.id, v).level)
        )
      )
    );
  }

  return { platforms, features };
}
