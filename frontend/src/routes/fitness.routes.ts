/**
 * fitness.routes.ts
 * Express route example — can be used as-is in a Node/Express backend.
 * In this project (Convex-based) treat this as reference only.
 */

import { Router, Request, Response } from "express";
import {
  getScore,
  scoreAll,
  getStageTests,
} from "../services/fitnessScoringService";
import type { Stage, Gender, TestKey } from "../types/fitness";

const router = Router();

// ─── POST /fitness/score ───────────────────────────────────────────────────────
// Body: { stage, gender, testKey, rawValue }
// Response: { score, unit_ar, direction, ... } | { error, message }
//
// Example request:
//   POST /fitness/score
//   { "stage": "primary", "gender": "boys", "testKey": "push_up", "rawValue": 33 }
//
// Example response:
//   { "score": 80, "stage": "primary", "gender": "boys", "testKey": "push_up",
//     "rawValue": 33, "unit_ar": "تكرار", "unit_en": "reps", "direction": "higher_is_better" }
//
router.post("/score", (req: Request, res: Response) => {
  const { stage, gender, testKey, rawValue } = req.body as {
    stage: Stage;
    gender: Gender;
    testKey: TestKey;
    rawValue: number;
  };

  if (!stage || !gender || !testKey || rawValue === undefined) {
    return res.status(400).json({
      error: true,
      code: "MISSING_FIELDS",
      message: "يجب إرسال: stage, gender, testKey, rawValue",
    });
  }

  const result = getScore({ stage, gender, testKey, rawValue });
  return "error" in result
    ? res.status(422).json(result)
    : res.json(result);
});

// ─── POST /fitness/score-all ──────────────────────────────────────────────────
// Body: { stage, gender, measurements: { push_up: 33, sit_up: 40, ... } }
// Response: { scores, total, count, average, errors }
//
// Example request:
//   POST /fitness/score-all
//   {
//     "stage": "primary",
//     "gender": "boys",
//     "measurements": { "push_up": 33, "sit_up": 40, "flexibility": 25.5,
//                       "agility": 9.8, "endurance": 3.21 }
//   }
//
// Example response:
//   {
//     "scores":  { "push_up": 80, "sit_up": 70, "flexibility": 60,
//                  "agility": 75, "endurance": 80 },
//     "total":   365,
//     "count":   5,
//     "average": 73,
//     "errors":  {}
//   }
//
router.post("/score-all", (req: Request, res: Response) => {
  const { stage, gender, measurements } = req.body as {
    stage: Stage;
    gender: Gender;
    measurements: Partial<Record<TestKey, number>>;
  };

  if (!stage || !gender || !measurements) {
    return res.status(400).json({
      error: true,
      code: "MISSING_FIELDS",
      message: "يجب إرسال: stage, gender, measurements",
    });
  }

  return res.json(scoreAll({ stage, gender, measurements }));
});

// ─── GET /fitness/tests/:stage ────────────────────────────────────────────────
// Returns list of available tests for a stage (no mappings, just metadata).
//
// Example: GET /fitness/tests/primary
// Response: [{ key, name_ar, name_en, unit_ar, unit_en, direction }, ...]
//
router.get("/tests/:stage", (req: Request, res: Response) => {
  const stage = req.params.stage as Stage;
  const tests = getStageTests(stage);
  if (tests.length === 0) {
    return res.status(404).json({ error: true, message: `المرحلة "${stage}" غير موجودة.` });
  }
  return res.json(tests);
});

export default router;

// ─── Mount in app.ts ─────────────────────────────────────────────────────────
// import fitnessRouter from "./routes/fitness.routes";
// app.use("/fitness", fitnessRouter);
