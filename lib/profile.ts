import { climateForRegion, deriveUniversityDestination } from "./climate";
import type { Profile } from "./types";

type LegacyDiet = "veg-cooking-heavy" | "eats-out" | "mixed";
type LegacyProfile = Partial<Profile> & { diet?: LegacyDiet };

const COOKING_MIGRATION: Record<LegacyDiet, NonNullable<Profile["cooking"]>> = {
  "veg-cooking-heavy": "daily",
  "eats-out": "rarely",
  mixed: "weekly",
};

export function migrateProfile(value: unknown): Profile {
  if (!value || typeof value !== "object") return {};
  const legacy = value as LegacyProfile;
  const { diet, ...current } = legacy;
  const profile: Profile = { ...current };

  if (!profile.cooking && diet && COOKING_MIGRATION[diet]) {
    profile.cooking = COOKING_MIGRATION[diet];
  }

  if (profile.university && (!profile.city || !profile.state || !profile.region)) {
    const destination = deriveUniversityDestination(profile.university);
    if (destination) Object.assign(profile, destination);
  }
  if (profile.region && !profile.climate) {
    profile.climate = climateForRegion(profile.region);
  }

  return profile;
}

export function hasRequiredCheckInAnswers(profile: Profile): boolean {
  const destinationKnown = Boolean(
    profile.university && profile.region && profile.climate,
  );
  const beverageCanSkip =
    profile.cooking === "rarely" && profile.housing === "dorm";

  return Boolean(
    profile.name &&
      destinationKnown &&
      profile.intake &&
      profile.housing &&
      profile.roommates &&
      profile.gender &&
      profile.dietPractice &&
      profile.cuisine &&
      profile.cooking &&
      (profile.beverage || beverageCanSkip),
  );
}

export const PROFILE_LABELS = {
  climate: { cold: "Cold", mixed: "Mixed", warm: "Warm" },
  intake: { fall: "Fall (Aug/Sep)", spring: "Spring (Jan)" },
  housing: { dorm: "On-campus dorm", apartment: "Off-campus apartment" },
  roommates: { alone: "Living alone", roommates: "With roommates" },
  gender: {
    male: "Male",
    female: "Female",
    nonbinary: "Non-binary",
    na: "Prefer not to say",
  },
  dietPractice: {
    veg: "Vegetarian",
    jain: "Jain",
    halal: "Halal",
    eggetarian: "Eggetarian",
    none: "No restrictions",
  },
  cuisine: {
    south: "South Indian",
    north: "North Indian",
    west: "West Indian",
    east: "East Indian",
  },
  cooking: {
    daily: "Almost daily",
    weekly: "A few times a week",
    rarely: "Rarely",
  },
  beverage: {
    "filter-coffee": "Filter coffee",
    chai: "Chai",
    both: "Both",
    none: "Neither",
  },
} as const;
