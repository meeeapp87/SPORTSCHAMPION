// ─── Core enums ──────────────────────────────────────────────────────────────

export type Stage = "primary" | "middle" | "secondary";
export type Gender = "boys" | "girls";
export type TestKey = "push_up" | "sit_up" | "flexibility" | "agility" | "endurance";
export type Direction = "higher_is_better" | "lower_is_better";

// ─── Data shapes (mirrors the JSON files) ────────────────────────────────────

export interface ScoreEntry {
  value: number;
  score: number;
}

export interface TestMappings {
  boys: ScoreEntry[];
  girls: ScoreEntry[];
}

export interface FitnessTest {
  key: TestKey;
  name_ar: string;
  name_en: string;
  unit_ar: string;
  unit_en: string;
  direction: Direction;
  mappings: TestMappings;
}

export interface StageStandard {
  stage: Stage;
  stage_ar: string;
  isOfficial: boolean;
  description_ar: string;
  tests: FitnessTest[];
}

export interface FitnessStandards {
  stages: StageStandard[];
}

// ─── Service I/O ──────────────────────────────────────────────────────────────

export interface GetScoreInput {
  stage: Stage;
  gender: Gender;
  testKey: TestKey;
  rawValue: number;
}

export interface GetScoreResult {
  score: number;
  stage: Stage;
  gender: Gender;
  testKey: TestKey;
  rawValue: number;
  unit_ar: string;
  unit_en: string;
  direction: Direction;
}

export interface GetScoreError {
  error: true;
  message: string;
  code: "STAGE_NOT_FOUND" | "TEST_NOT_FOUND" | "MAPPING_EMPTY";
}

export type ScoreResponse = GetScoreResult | GetScoreError;
