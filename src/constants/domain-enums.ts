/**
 * Copie des enums team-service — garder synchronisé avec
 * `services/team-service/src/constants/domain-enums.ts`.
 */
export const SECTION_CATEGORY_VALUES = [
  "U8",
  "U11",
  "U13",
  "U15",
  "U18",
  "SENIOR",
  "LOISIR"
] as const;

export type SectionCategory = (typeof SECTION_CATEGORY_VALUES)[number];

export const GENDER_DIVISION_VALUES = ["MASCULIN", "FEMININ", "MIXTE"] as const;

export type GenderDivision = (typeof GENDER_DIVISION_VALUES)[number];

export function isSectionCategory(value: string): value is SectionCategory {
  return (SECTION_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function isGenderDivision(value: string): value is GenderDivision {
  return (GENDER_DIVISION_VALUES as readonly string[]).includes(value);
}
