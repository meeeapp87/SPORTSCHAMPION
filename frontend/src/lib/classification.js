/**
 * نظام التصنيف الديناميكي للمراحل الدراسية
 * Dynamic stage classification based on academic year + birth year
 *
 * المنطق:
 *   - يقرأ السنة الأكاديمية (e.g. "2025-2026")
 *   - يحسب العمر المتوقع لكل طالب في بداية العام الأكاديمي
 *   - يصنّفه تلقائياً إلى ابتدائي / إعدادي / ثانوي
 *
 * أعمار المراحل في قطر (وزارة التربية والتعليم):
 *   ابتدائي: الصف الأول-السادس        → أعمار 6 إلى 11
 *   إعدادي:  الصف السابع-التاسع        → أعمار 12 إلى 14
 *   ثانوي:   الصف العاشر-الثاني عشر    → أعمار 15 إلى 17
 *
 * نظراً لأن النظام يركز على الصفوف الأعلى من كل مرحلة:
 *   ابتدائي → الرابع، الخامس، السادس (10 / 11 / 12 سنة)
 *   إعدادي  → الأول، الثاني، الثالث الإعدادي (13 / 14 / 15 سنة)
 *   ثانوي   → الصف 10 / 11 / 12 (16 / 17 / 18 سنة)
 */

// ── Helpers ─────────────────────────────────────────────

/** تحويل "2025-2026" أو "2025/2026" إلى [2025, 2026] */
export function parseAcademicYear(academicYear) {
  if (!academicYear) return null;
  const match = String(academicYear).match(/(\d{4}).*?(\d{4})/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

/** السنة الأكاديمية الحالية بناءً على تاريخ اليوم */
export function getCurrentAcademicYear(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12
  // العام الدراسي يبدأ في سبتمبر تقريباً
  const start = month >= 9 ? year : year - 1;
  return `${start}-${start + 1}`;
}

// ── Main classifier ────────────────────────────────────

/**
 * إرجاع نطاقات سنوات الميلاد لكل مرحلة بالنسبة لسنة أكاديمية معينة
 *
 * @param {string} academicYear  مثال: "2025-2026"
 * @returns {{
 *   ابتدائي: number[],
 *   إعدادي:  number[],
 *   ثانوي:   number[],
 * }}
 */
export function getStageBirthYearRanges(academicYear) {
  const parsed = parseAcademicYear(academicYear);
  if (!parsed) return { "ابتدائي": [], "إعدادي": [], "ثانوي": [] };

  const [startYear] = parsed;
  // العام الأكاديمي 2025-2026 → ثانوي يأخذ مواليد 2008, 2009, 2010
  // أي العمر المتوقع 15, 16, 17 في بداية العام الأكاديمي
  const secondary  = [startYear - 17, startYear - 16, startYear - 15]; // 10, 11, 12
  const middle     = [startYear - 14, startYear - 13, startYear - 12]; // الإعدادي 1, 2, 3
  const primary    = [startYear - 11, startYear - 10, startYear - 9];  // الرابع, الخامس, السادس

  return {
    "ابتدائي": primary,
    "إعدادي":  middle,
    "ثانوي":   secondary,
  };
}

/**
 * تصنيف طالب إلى مرحلة دراسية بناءً على سنة الميلاد والسنة الأكاديمية
 *
 * @param {number} birthYear
 * @param {string} academicYear  مثال: "2025-2026"
 * @returns {"ابتدائي"|"إعدادي"|"ثانوي"|null}
 */
export function classifyStage(birthYear, academicYear) {
  if (!birthYear || !academicYear) return null;
  const ranges = getStageBirthYearRanges(academicYear);
  for (const [stage, years] of Object.entries(ranges)) {
    if (years.includes(birthYear)) return stage;
  }
  return null;
}

/**
 * استخراج جميع السنوات الأكاديمية للسنوات الـ N الماضية
 * @param {number} years  عدد السنوات (default: 3)
 * @param {Date} today
 * @returns {string[]}  مثال: ["2025-2026", "2024-2025", "2023-2024"]
 */
export function getRecentAcademicYears(years = 3, today = new Date()) {
  const current = getCurrentAcademicYear(today);
  const [start] = parseAcademicYear(current);
  const result = [];
  for (let i = 0; i < years; i++) {
    const s = start - i;
    result.push(`${s}-${s + 1}`);
  }
  return result;
}
