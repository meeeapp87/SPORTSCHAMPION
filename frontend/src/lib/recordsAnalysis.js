/**
 * Records Analysis Service
 * ════════════════════════
 * يستخرج الأرقام القياسية الأعلى لكل اختبار × مرحلة × جنس
 * عبر دمج بيانات آخر 3 سنوات أكاديمية:
 *
 *   1. الـ DB (Convex `students`) — السنة الأكاديمية الحالية
 *   2. WINNERS_2024 — السنة الأكاديمية 2023-2024 (فيه أرقام تفصيلية لكل اختبار × مرحلة)
 *
 * البيانات الموسمية للعامين 2024-2025 و 2025-2026 (WINNERS_2025, HISTORICAL_WINNERS)
 * تحتوي على أسماء الفائزين بحسب الفئة العمرية فقط (بدون أرقام)، لذلك
 * لا تساهم مباشرةً في حساب الأرقام القياسية، لكنها تُعرض كسجلات تاريخية.
 *
 * منطق العمل:
 *   ① تحميل المصدرين أعلاه
 *   ② توحيد الشكل في AnalyticsEntry موحّد
 *   ③ تنظيف: تجاهل null/0/غير الرقمي + إزالة المكررات (احتفظ بأعلى نتيجة لنفس الطالب)
 *   ④ تصنيف ديناميكي للمرحلة (لو سنة الميلاد متوفرة)
 *   ⑤ تجميع حسب اختبار × مرحلة × جنس
 *   ⑥ استخراج الأعلى (أو الأقل لو lowerBetter=true)
 */

import { classifyStage, getCurrentAcademicYear } from "./classification";

// ── ثابتات ──────────────────────────────────────────────

export const TESTS = [
  { key: "pushUpScore",      label: "اختبار الضغط",   unit: "تكرار", lowerBetter: false },
  { key: "sitUpScore",       label: "اختبار البطن",   unit: "تكرار", lowerBetter: false },
  { key: "flexibilityScore", label: "اختبار المرونة", unit: "سم",    lowerBetter: false },
  { key: "agilityScore",     label: "اختبار الرشاقة", unit: "ثانية", lowerBetter: true  },
  { key: "enduranceScore",   label: "اختبار التحمل",  unit: "دقيقة", lowerBetter: false },
];

export const STAGES = ["ابتدائي", "إعدادي", "ثانوي"];
export const GENDERS = ["بنين", "بنات"];

// خريطة لربط أسماء اختبارات WINNERS_2024 (العربي) بـ test keys
const TEST_NAME_TO_KEY = {
  "الضغط":   "pushUpScore",
  "البطن":   "sitUpScore",
  "المرونة": "flexibilityScore",
  "الرشاقة": "agilityScore",
  "التحمل":  "enduranceScore",
};

// خريطة لربط مراحل WINNERS_2024 (بالألف لام) إلى مراحل النظام
const STAGE_2024_TO_APP = {
  "النموذجية": "ابتدائي",
  "الابتدائية": "ابتدائي",
  "الإعدادية": "إعدادي",
  "الثانوية":  "ثانوي",
};

// ── Helpers ─────────────────────────────────────────────

/** تحويل score النصي إلى رقم. يدعم "3:11.59" (دقائق:ثواني) */
export function parseScoreValue(raw, isTime = false) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (isTime && s.includes(":")) {
    const [m, rest] = s.split(":");
    const mNum = parseInt(m, 10);
    const sNum = parseFloat(rest);
    if (isNaN(mNum) || isNaN(sNum)) return null;
    return mNum * 60 + sNum;
  }
  const n = parseFloat(s);
  if (isNaN(n) || !isFinite(n) || n <= 0) return null;
  return n;
}

/** قيمة قابلة للعرض من النتيجة الأصلية */
export function displayScore(raw) {
  if (raw == null) return "—";
  return String(raw);
}

// ── محوّلات المصادر ─────────────────────────────────────

/**
 * يحوّل بيانات سنة منظَّمة بحسب سنة الميلاد إلى AnalyticsEntry[]
 * (هذه البيانات لا تحتوي على scores تفصيلية — فقط أسماء الفائزين بكل فئة عمرية)
 *
 * @param {object}  data            مثال: WINNERS_2025 أو HISTORICAL_WINNERS
 * @param {string}  academicYear    "2024-2025" أو "2025-2026"
 * @param {string}  sourceLabel     "winners_2025" / "winners_2026"
 * @returns {AnalyticsEntry[]}
 */
export function flattenAgeGroupWinners(data, academicYear, sourceLabel) {
  if (!data) return [];
  const entries = [];
  for (const gender of GENDERS) {
    const rows = data[gender];
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      const birthYear = parseInt(row.year ?? row.age, 10);
      const stage     = classifyStage(birthYear, academicYear) || null;

      for (const medalKey of ["gold", "silver", "bronze"]) {
        const m = row[medalKey];
        if (!m) continue;
        entries.push({
          source:       sourceLabel,
          academicYear,
          fullName:     m.name,
          schoolName:   m.school,
          gender,
          stage,
          birthYear:    isNaN(birthYear) ? null : birthYear,
          medalRank:    medalKey,   // gold / silver / bronze
          scores:       {},          // لا توجد نتائج رقمية لهذه المصادر
        });
      }
    }
  }
  return entries;
}

/**
 * يحوّل WINNERS_2024 إلى AnalyticsEntry[]
 * @param {object} winners2024
 * @returns {AnalyticsEntry[]}
 */
export function flattenWinners2024(winners2024) {
  const entries = [];
  for (const gender of GENDERS) {
    const byTest = winners2024[gender];
    if (!byTest) continue;

    for (const [arabicTest, testObj] of Object.entries(byTest)) {
      const testKey = TEST_NAME_TO_KEY[arabicTest];
      if (!testKey) continue;
      const stages = testObj?.stages ?? {};

      for (const [arabicStage, medals] of Object.entries(stages)) {
        const stage = STAGE_2024_TO_APP[arabicStage];
        if (!stage) continue;

        for (const medalKey of ["gold", "silver", "bronze"]) {
          const m = medals[medalKey];
          if (!m) continue;

          entries.push({
            source:       "winners_2024",
            academicYear: "2023-2024",
            fullName:     m.name,
            schoolName:   m.school,
            gender,
            stage,
            birthYear:    null,
            scores:       { [testKey]: m.score },
          });
        }
      }
    }
  }
  return entries;
}

/**
 * يحوّل JSON نتائج موسم (مثل results2026.json) إلى AnalyticsEntry[]
 *
 * @param {object} data            { academicYear, students: [...] }
 * @param {string?} academicYearOverride  override للسنة الأكاديمية
 * @returns {AnalyticsEntry[]}
 */
export function flattenSeasonResults(data, academicYearOverride) {
  if (!data || !Array.isArray(data.students)) return [];
  const academicYear = academicYearOverride || data.academicYear || "—";
  return data.students.map(s => ({
    source:       "results_json",
    academicYear,
    fullName:     s.fullName,
    schoolName:   s.school,
    gender:       s.gender,
    stage:        s.stage,
    birthYear:    s.birthYear,
    personalId:   s.personalId,
    nationality:  s.nationality,
    scores: {
      pushUpScore:      s.pushUp,
      sitUpScore:       s.sitUp,
      flexibilityScore: s.flexibility,
      agilityScore:     s.agility,
      enduranceScore:   s.endurance,
    },
  }));
}

/**
 * يحوّل صفوف الـ DB إلى AnalyticsEntry[]
 * @param {Array} students    students from Convex
 * @param {object} schoolsMap  map<schoolId, school>
 * @param {string} academicYear مثال: "2025-2026"
 */
export function flattenDbStudents(students, schoolsMap, academicYear) {
  return students.map(s => {
    const school = schoolsMap[s.schoolId];
    const gender = school?.gender || null;
    return {
      source:       "db",
      academicYear,
      fullName:     s.fullName,
      schoolName:   s.schoolName,
      gender,
      stage:        s.stage,
      birthYear:    s.birthYear,
      personalId:   s.personalId,
      _id:          s._id,
      scores: {
        pushUpScore:      s.pushUpScore,
        sitUpScore:       s.sitUpScore,
        flexibilityScore: s.flexibilityScore,
        agilityScore:     s.agilityScore,
        enduranceScore:   s.enduranceScore,
      },
    };
  });
}

// ── التنظيف والتصنيف الديناميكي ─────────────────────────

/**
 * - يصنّف المرحلة ديناميكياً من سنة الميلاد إذا أمكن
 * - يتجاهل القيم الفارغة / 0 / غير الرقمية
 * - يدمج المكررات (نفس الـ personalId أو fullName+schoolName+gender) بأخذ الأعلى لكل اختبار
 */
export function cleanAndDedup(entries) {
  // 1) تصنيف ديناميكي عند الإمكان
  const classified = entries.map(e => {
    if (e.birthYear && e.academicYear) {
      const derived = classifyStage(e.birthYear, e.academicYear);
      if (derived) return { ...e, stage: derived };
    }
    return e;
  });

  // 2) فلترة الأسطر اللي ما عندهاش حد أدنى من المعلومات
  //    نحتفظ بالأسطر بدون نتائج رقمية (للإحصائيات وعرض الأبطال)
  const filtered = classified.filter(e =>
    e.fullName && e.gender && e.stage
  );

  // 3) إزالة التكرار داخل نفس السنة الأكاديمية فقط
  //    (الطالب نفسه عبر سنوات مختلفة = entries مستقلة لكل سنة)
  const dedupMap = new Map();
  for (const e of filtered) {
    const yearKey = e.academicYear || "UNKNOWN";
    const key = e.personalId
      ? `${yearKey}|pid:${e.personalId}`
      : `${yearKey}|${e.gender}|${e.fullName}|${e.schoolName}`;

    if (!dedupMap.has(key)) {
      dedupMap.set(key, { ...e, scores: { ...e.scores } });
    } else {
      const existing = dedupMap.get(key);
      for (const test of TESTS) {
        const newVal = parseScoreValue(e.scores[test.key], test.key === "enduranceScore");
        const oldVal = parseScoreValue(existing.scores[test.key], test.key === "enduranceScore");
        if (newVal == null) continue;
        if (oldVal == null) {
          existing.scores[test.key] = e.scores[test.key];
        } else {
          const better = test.lowerBetter ? newVal < oldVal : newVal > oldVal;
          if (better) existing.scores[test.key] = e.scores[test.key];
        }
      }
    }
  }
  return Array.from(dedupMap.values());
}

// ── المحرّك الرئيسي ─────────────────────────────────────

/**
 * Compute records: أعلى رقم قياسي لكل (test × stage × gender)
 *
 * @param {AnalyticsEntry[]} entries
 * @returns {RecordEntry[]}
 */
export function computeRecords(entries) {
  const results = [];

  for (const gender of GENDERS) {
    for (const stage of STAGES) {
      for (const test of TESTS) {
        const isTime = test.key === "enduranceScore";

        // مرشحون: كل الـ entries اللي عندها نتيجة صالحة في هذا الاختبار
        const candidates = entries
          .filter(e => e.gender === gender && e.stage === stage)
          .map(e => ({ entry: e, raw: e.scores[test.key], num: parseScoreValue(e.scores[test.key], isTime) }))
          .filter(c => c.num != null);

        if (candidates.length === 0) {
          results.push({
            test:   test.key,
            testLabel: test.label,
            unit:   test.unit,
            stage,
            gender,
            holder: null,
            score:  null,
            displayScore: "—",
            lowerBetter: test.lowerBetter,
          });
          continue;
        }

        const best = candidates.reduce((a, b) =>
          (test.lowerBetter ? a.num < b.num : a.num > b.num) ? a : b
        );

        results.push({
          test:        test.key,
          testLabel:   test.label,
          unit:        test.unit,
          stage,
          gender,
          score:       best.num,
          displayScore: displayScore(best.raw),
          holder:      best.entry,
          lowerBetter: test.lowerBetter,
        });
      }
    }
  }

  return results;
}

// ── Pipeline موحّد جاهز للاستخدام ───────────────────────

/**
 * Pipeline كامل: يأخذ مصادر البيانات الخام ويُرجع الأرقام القياسية النهائية
 *
 * @param {Object}   params
 * @param {Array}    params.dbStudents   students from Convex
 * @param {Array}    params.schools      schools from Convex
 * @param {Object}   params.winners2024  static JSON
 * @param {string?}  params.currentAcademicYear
 *
 * @returns {{
 *   records:    RecordEntry[],
 *   allEntries: AnalyticsEntry[],
 *   stats:      { totalEntries, byYear, byStage, byGender }
 * }}
 */
export function runRecordsPipeline({
  dbStudents = [],
  schools = [],
  winners2024 = null,
  winners2025 = null,
  winners2026 = null,
  results2025 = null,                          // النتائج الكاملة لموسم 2024-2025 (raw data)
  results2026 = null,                          // النتائج الكاملة لموسم 2025-2026 (raw data)
  currentAcademicYear = getCurrentAcademicYear(),
}) {
  const schoolsMap = {};
  for (const s of schools) schoolsMap[s._id] = s;

  // ① تجميع المصادر
  const dbEntries        = flattenDbStudents(dbStudents, schoolsMap, currentAcademicYear);
  const w2024Entries     = winners2024 ? flattenWinners2024(winners2024) : [];
  const w2025Entries     = winners2025 ? flattenAgeGroupWinners(winners2025, "2024-2025", "winners_2025") : [];
  const w2026Entries     = winners2026 ? flattenAgeGroupWinners(winners2026, "2025-2026", "winners_2026") : [];
  const season25Entries  = results2025 ? flattenSeasonResults(results2025, "2024-2025") : [];
  const seasonEntries    = results2026 ? flattenSeasonResults(results2026, "2025-2026") : [];
  const allRaw           = [...dbEntries, ...w2024Entries, ...w2025Entries, ...w2026Entries, ...season25Entries, ...seasonEntries];

  // ② تنظيف + تصنيف ديناميكي + dedup
  const allEntries = cleanAndDedup(allRaw);

  // ③ استخراج الأرقام القياسية
  const records = computeRecords(allEntries);

  // ④ إحصائيات للـ Dashboard
  const stats = {
    totalEntries: allEntries.length,
    byYear:       groupCount(allEntries, e => e.academicYear),
    byStage:      groupCount(allEntries, e => e.stage),
    byGender:     groupCount(allEntries, e => e.gender),
  };

  return { records, allEntries, stats };
}

function groupCount(arr, keyFn) {
  const map = {};
  for (const x of arr) {
    const k = keyFn(x);
    if (!k) continue;
    map[k] = (map[k] || 0) + 1;
  }
  return map;
}
