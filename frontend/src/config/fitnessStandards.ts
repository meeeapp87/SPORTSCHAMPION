import type { FitnessStandards } from "../types/fitness";
import primaryRaw from "../data/fitness_standards_primary.json";
import middleRaw from "../data/fitness_standards_middle.json";
import secondaryRaw from "../data/fitness_standards_secondary.json";

/**
 * Single source of truth — all three stages merged into one object.
 * Import this anywhere you need fitness data instead of importing
 * the individual JSON files.
 */
const fitnessStandards: FitnessStandards = {
  stages: [
    primaryRaw as any,
    middleRaw as any,
    secondaryRaw as any,
  ],
};

export default fitnessStandards;

/** Quick lookup map: stage → StageStandard */
export const STAGE_MAP = Object.fromEntries(
  fitnessStandards.stages.map((s) => [s.stage, s])
) as Record<string, (typeof fitnessStandards.stages)[number]>;
