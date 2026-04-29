import { STAGE_MAP } from "../config/fitnessStandards";
import type {
  Stage,
  Gender,
  TestKey,
  GetScoreInput,
  ScoreResponse,
  GetScoreResult,
  GetScoreError,
  ScoreEntry,
  FitnessTest,
} from "../types/fitness";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreError(
  code: GetScoreError["code"],
  message: string
): GetScoreError {
  return { error: true, code, message };
}

/**
 * Binary-search style lookup for higher_is_better:
 * Return the score of the largest threshold ≤ rawValue.
 * If rawValue is above all thresholds → highest score.
 * If rawValue is below all thresholds → lowest score.
 *
 * Assumption: mappings are sorted DESCENDING by value (as in the JSON files).
 */
function lookupHigherIsBetter(entries: ScoreEntry[], raw: number): number {
  // entries: [ {value:40,score:100}, {value:39,score:98}, ..., {value:17,score:0} ]
  for (const entry of entries) {
    if (raw >= entry.value) return entry.score;
  }
  return entries[entries.length - 1].score; // below the lowest threshold
}

/**
 * Lookup for lower_is_better:
 * Return the score of the smallest threshold ≥ rawValue.
 * If rawValue is below all thresholds → highest score.
 * If rawValue is above all thresholds → lowest score.
 *
 * Assumption: mappings are sorted ASCENDING by value (as in the JSON files).
 */
function lookupLowerIsBetter(entries: ScoreEntry[], raw: number): number {
  // entries: [ {value:9.0,score:100}, {value:9.1,score:98}, ..., {value:11.3,score:0} ]
  for (const entry of entries) {
    if (raw <= entry.value) return entry.score;
  }
  return entries[entries.length - 1].score; // above the highest threshold
}

// ─── Core scoring function ────────────────────────────────────────────────────

/**
 * getScore — convert a raw measurement into a score 0–100.
 *
 * @example
 * getScore({ stage: "primary", gender: "boys", testKey: "push_up", rawValue: 33 })
 * // → { score: 80, ... }
 */
export function getScore(input: GetScoreInput): ScoreResponse {
  const { stage, gender, testKey, rawValue } = input;

  // 1. Find stage
  const stageData = STAGE_MAP[stage];
  if (!stageData) {
    return scoreError("STAGE_NOT_FOUND", `المرحلة "${stage}" غير موجودة.`);
  }

  // 2. Find test
  const test: FitnessTest | undefined = stageData.tests.find(
    (t) => t.key === testKey
  );
  if (!test) {
    return scoreError(
      "TEST_NOT_FOUND",
      `الاختبار "${testKey}" غير موجود في المرحلة "${stage}".`
    );
  }

  // 3. Get gender mappings
  const entries: ScoreEntry[] = test.mappings[gender] ?? [];
  if (entries.length === 0) {
    return scoreError(
      "MAPPING_EMPTY",
      `لا يوجد بيانات للجنس "${gender}" في الاختبار "${testKey}" / المرحلة "${stage}".`
    );
  }

  // 4. Compute score
  const score =
    test.direction === "higher_is_better"
      ? lookupHigherIsBetter(entries, rawValue)
      : lookupLowerIsBetter(entries, rawValue);

  const result: GetScoreResult = {
    score,
    stage,
    gender,
    testKey,
    rawValue,
    unit_ar: test.unit_ar,
    unit_en: test.unit_en,
    direction: test.direction,
  };

  return result;
}

// ─── Batch scoring ─────────────────────────────────────────────────────────────

export interface BatchInput {
  stage: Stage;
  gender: Gender;
  measurements: Partial<Record<TestKey, number>>;
}

export interface BatchResult {
  scores: Partial<Record<TestKey, number>>;
  total: number;
  count: number;
  average: number;
  errors: Partial<Record<TestKey, string>>;
}

/**
 * scoreAll — score every provided measurement at once.
 * Returns per-test scores, total, and average (ignores failed tests).
 *
 * @example
 * scoreAll({
 *   stage: "primary",
 *   gender: "boys",
 *   measurements: { push_up: 33, sit_up: 40, flexibility: 25 }
 * })
 */
export function scoreAll(input: BatchInput): BatchResult {
  const result: BatchResult = {
    scores: {},
    total: 0,
    count: 0,
    average: 0,
    errors: {},
  };

  for (const [testKey, rawValue] of Object.entries(input.measurements) as [
    TestKey,
    number
  ][]) {
    const res = getScore({
      stage: input.stage,
      gender: input.gender,
      testKey,
      rawValue,
    });

    if ("error" in res) {
      result.errors[testKey] = res.message;
    } else {
      result.scores[testKey] = res.score;
      result.total += res.score;
      result.count++;
    }
  }

  result.average =
    result.count > 0 ? Math.round(result.total / result.count) : 0;

  return result;
}

// ─── Utility: list available tests for a stage ───────────────────────────────

export function getStageTests(stage: Stage) {
  const stageData = STAGE_MAP[stage];
  if (!stageData) return [];
  return stageData.tests.map(({ key, name_ar, name_en, unit_ar, unit_en, direction }) => ({
    key,
    name_ar,
    name_en,
    unit_ar,
    unit_en,
    direction,
  }));
}
