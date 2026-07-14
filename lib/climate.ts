import universityGeo from "@/data/university-geo.json";
import type { Profile } from "./types";

type Climate = NonNullable<Profile["climate"]>;
type Region = NonNullable<Profile["region"]>;

export interface DerivedDestination {
  city: string;
  state: string;
  region: Region;
  climate: Climate;
}

const NORTHEAST = new Set([
  "CT", "DE", "DC", "ME", "MD", "MA", "NH", "NJ", "NY", "PA", "RI", "VT",
]);
const MIDWEST = new Set([
  "IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI",
]);
const SOUTH = new Set([
  "AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "OK", "SC", "TN", "TX", "VA", "WV",
]);

const COLD_STATES = new Set([
  "AK", "CO", "CT", "IA", "ID", "IL", "IN", "KS", "MA", "ME", "MI", "MN",
  "MT", "ND", "NE", "NH", "NY", "OH", "PA", "RI", "SD", "UT", "VT", "WI", "WY",
]);
const WARM_STATES = new Set([
  "AL", "AZ", "FL", "GA", "HI", "LA", "MS", "SC", "TX",
]);

const CITY_OVERRIDES: Record<string, Climate> = {
  "CA|Berkeley": "mixed",
  "CA|Davis": "mixed",
  "CA|Irvine": "warm",
  "CA|Los Angeles": "warm",
  "CA|Riverside": "warm",
  "CA|San Diego": "warm",
  "CA|San Francisco": "mixed",
  "CA|Santa Barbara": "warm",
  "CA|Santa Cruz": "mixed",
  "NV|Las Vegas": "warm",
  "NV|Reno": "cold",
  "OR|Eugene": "mixed",
  "OR|Portland": "mixed",
  "WA|Pullman": "cold",
  "WA|Seattle": "mixed",
};

const GEO = universityGeo as Record<string, { city: string; state: string }>;
const GEO_NORMALIZED = new Map(
  Object.entries(GEO).map(([name, location]) => [normalize(name), location]),
);

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

export function regionForState(state: string): Region {
  if (NORTHEAST.has(state)) return "northeast";
  if (MIDWEST.has(state)) return "midwest";
  if (SOUTH.has(state)) return "south";
  return "west";
}

export function climateForLocation(state: string, city?: string): Climate {
  if (city && CITY_OVERRIDES[`${state}|${city}`]) {
    return CITY_OVERRIDES[`${state}|${city}`];
  }
  if (COLD_STATES.has(state)) return "cold";
  if (WARM_STATES.has(state)) return "warm";
  return "mixed";
}

export function deriveUniversityDestination(
  university: string,
): DerivedDestination | null {
  const location = GEO[university] ?? GEO_NORMALIZED.get(normalize(university));
  if (!location) return null;
  return {
    ...location,
    region: regionForState(location.state),
    climate: climateForLocation(location.state, location.city),
  };
}

export function climateForRegion(region: Region): Climate {
  if (region === "northeast" || region === "midwest") return "cold";
  if (region === "south") return "warm";
  return "mixed";
}

export const REGION_LABELS: Record<Region, string> = {
  northeast: "Northeast",
  midwest: "Midwest",
  south: "South",
  west: "West Coast",
};

export const CLIMATE_LABELS: Record<Climate, string> = {
  cold: "cold zone",
  mixed: "mixed climate",
  warm: "warm zone",
};

export function destinationInsight(profile: Profile): string | null {
  if (!profile.city || !profile.state || !profile.region || !profile.climate) return null;
  const destination = `${profile.city}, ${profile.state}`;
  const region = REGION_LABELS[profile.region];
  if (profile.climate === "cold") {
    return `✈ ${destination} · ${region} cold zone. Winters can drop below 0°F. Thermals matter; buy the heavy down coat there unless you land in January.`;
  }
  if (profile.climate === "warm") {
    return `✈ ${destination} · ${region} warm zone. Skip bulky winter gear; one light transit layer is enough.`;
  }
  return `✈ ${destination} · ${region}, mixed climate. Pack layers for changeable weather and buy specialized outerwear after you arrive.`;
}
