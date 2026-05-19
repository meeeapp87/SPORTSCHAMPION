/* eslint-disable */
// Parse all 2025-2026 results from Excel files
// Output: frontend/src/data/results2026.json
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const BASE = path.resolve(__dirname, '..', '..', 'نتائج2025 -2026');

// خرائط: اسم الملف → معلومات (مرحلة)
const SOURCES = [
  { folder: 'نتائج البنين مجمعة', gender: 'بنين' },
  { folder: 'نتائج البنات مجمعة', gender: 'بنات' },
];

/**
 * يستخرج المرحلة المدرسية من اسم الملف
 * "نموذجي" يُعامل كمرحلة ابتدائي (نموذجي/ابتدائي معاً تحت الابتدائي)
 */
function inferStageFromFilename(fname) {
  const n = fname.toLowerCase();
  if (n.includes('نموذجي'))  return 'ابتدائي'; // النموذجية أيضاً ابتدائي
  if (n.includes('ابتدائي'))  return 'ابتدائي';
  if (n.includes('اعدادي') || n.includes('إعدادي')) return 'إعدادي';
  if (n.includes('ثانوي'))    return 'ثانوي';
  return null;
}

function isValidString(v) {
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (s === '0') return false;
  return true;
}

function parseNumber(v) {
  if (v == null || v === '' || v === '0' || v === 0) return null;
  const n = parseFloat(String(v));
  if (!isFinite(n) || n <= 0) return null;
  return n;
}

function parseResultsFile(filePath, gender) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets['الكشف المجمع'];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  // The header is in row 2 (index 2), data starts row 4 (index 4)
  // Columns (based on inspection):
  //   1: school, 2: fullName, 3: personalId, 4: nationality, 5: birthYear, 6: grade,
  //   7: height, 8: weight, 9: BMI, 10: BMI label, 11: gender, 12: stage,
  //   13: pushUp(reps), 14: pushUp(mark),
  //   15: sitUp(reps),  16: sitUp(mark),
  //   17: flexibility(cm), 18: flexibility(mark),
  //   19: agility(sec), 20: agility(mark),
  //   21: endurance(time), 22: endurance(mark),
  //   23: totalMark, 24: rank

  const students = [];
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 12) continue;

    const school     = isValidString(r[1]) ? String(r[1]).trim() : null;
    const fullName   = isValidString(r[2]) ? String(r[2]).trim() : null;
    const personalId = isValidString(r[3]) ? String(r[3]).trim() : null;
    const nationality = isValidString(r[4]) ? String(r[4]).trim() : null;
    const birthYear  = parseNumber(r[5]);
    let stageRaw     = isValidString(r[12]) ? String(r[12]).trim() : null;

    // normalize stage names
    if (stageRaw === 'اعدادي') stageRaw = 'إعدادي';
    if (stageRaw === 'المرحلة الدراسية') stageRaw = null; // header leak

    // تجاهل الصفوف اللي مفيهاش اسم طالب أو مدرسة أو رقم بطاقة (header leaks)
    if (!fullName || !school) continue;
    if (fullName === 'اسم الطالب الثلاثي' || school === 'اسم المدرسة') continue;
    if (!personalId || personalId.startsWith('PERSONAL') || personalId === 'ID') continue;

    const pushUp   = parseNumber(r[13]);
    const sitUp    = parseNumber(r[15]);
    const flex     = parseNumber(r[17]);
    const agility  = parseNumber(r[19]);
    const endurance = parseNumber(r[21]);   // قد تكون 3.17 (3:17) أو 3.17 دقيقة عشرية

    // نتجاهل الطلاب اللي ما عندهمش أي نتيجة
    if (![pushUp, sitUp, flex, agility, endurance].some(v => v != null)) continue;

    students.push({
      school,
      fullName,
      personalId,
      nationality,
      birthYear,
      gender,
      stage: stageRaw || null,
      pushUp,
      sitUp,
      flexibility: flex,
      agility,
      endurance,    // raw value as-is
    });
  }

  return students;
}

// Main
const allStudents = [];
for (const src of SOURCES) {
  const dir = path.join(BASE, src.folder);
  if (!fs.existsSync(dir)) {
    console.warn('⚠ folder missing:', dir);
    continue;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  for (const fname of files) {
    const stage = inferStageFromFilename(fname);
    const fpath = path.join(dir, fname);
    console.log(`📄 ${src.gender} — ${stage || '?'} — ${fname}`);
    const list = parseResultsFile(fpath, src.gender);
    // override stage if Excel didn't have it
    for (const s of list) if (!s.stage) s.stage = stage;
    console.log(`   → ${list.length} students`);
    allStudents.push(...list);
  }
}

console.log('\n📊 TOTAL:', allStudents.length);

// إحصائيات سريعة
const byStage = {}, byGender = {};
for (const s of allStudents) {
  byStage[s.stage]   = (byStage[s.stage]   || 0) + 1;
  byGender[s.gender] = (byGender[s.gender] || 0) + 1;
}
console.log('By stage:', byStage);
console.log('By gender:', byGender);

const outPath = path.resolve(__dirname, '..', 'src', 'data', 'results2026.json');
fs.writeFileSync(outPath, JSON.stringify({
  academicYear: '2025-2026',
  generatedAt: new Date().toISOString(),
  count: allStudents.length,
  students: allStudents,
}, null, 2), 'utf8');
console.log('\n✅ Wrote', outPath);
