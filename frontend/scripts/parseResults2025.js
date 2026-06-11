/* eslint-disable */
// Parse all 2024-2025 results from Excel files
// Output: frontend/src/data/results2025.json
//
// مصدر البيانات: مجلد "2024-2025" في جذر المستودع، مجلدان (بنين / بنات)،
// وكل ملف يحتوي أوراق FINAL (YEAR BORN ....) — ورقة لكل سنة ميلاد.
// ترتيب الأعمدة مطابق لملفات 2025-2026 (نفس القالب الرسمي):
//   B(1): school, C(2): fullName, D(3): personalId, E(4): nationality, F(5): birthYear,
//   ... M(12): gender, N(13)/stage ...
//   O(13): pushUp reps,  Q(15): sitUp reps,  S(17): flexibility cm,
//   U(19): agility sec,  W(21): endurance time
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const BASE = path.resolve(__dirname, '..', '..', '2024-2025');

const SOURCES = [
  { folder: 'بنين', gender: 'بنين' },
  { folder: 'بنات', gender: 'بنات' },
];

function inferStageFromFilename(fname) {
  const n = fname.toLowerCase();
  if (n.includes('ابتدائي')) return 'ابتدائي';
  if (n.includes('اعدادي') || n.includes('إعدادي')) return 'إعدادي';
  if (n.includes('ثانوي'))   return 'ثانوي';
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

function parseFinalSheet(sheet, gender, stageFromFile) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  const students = [];
  // الترويسة في صف 4 (index 3) والبيانات تبدأ من صف 5 (index 4)
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 12) continue;

    const school     = isValidString(r[1]) ? String(r[1]).trim() : null;
    const fullName   = isValidString(r[2]) ? String(r[2]).trim() : null;
    const personalId = isValidString(r[3]) ? String(r[3]).trim() : null;
    const nationality = isValidString(r[4]) ? String(r[4]).trim() : null;
    const birthYear  = parseNumber(r[5]);
    let stageRaw     = isValidString(r[12]) ? String(r[12]).trim() : null;

    if (stageRaw === 'اعدادي') stageRaw = 'إعدادي';
    if (stageRaw === 'المرحلة الدراسية') stageRaw = null; // header leak

    // تجاهل صفوف بلا اسم/مدرسة (header leaks)
    if (!fullName || !school) continue;
    if (fullName === 'اسم الطالب الثلاثي' || school === 'اسم المدرسة') continue;

    const pushUp    = parseNumber(r[13]);   // O: تكرار الضغط
    const sitUp     = parseNumber(r[15]);   // Q: تكرار البطن
    const flex      = parseNumber(r[17]);   // S: المرونة (سم)
    const agility   = parseNumber(r[19]);   // U: الجري الارتدادي (ث)
    const endurance = parseNumber(r[21]);   // W: جري 800م/التحمل (دقيقة)

    if (![pushUp, sitUp, flex, agility, endurance].some(v => v != null)) continue;

    students.push({
      school,
      fullName,
      personalId,
      nationality,
      birthYear,
      gender,
      stage: stageRaw || stageFromFile || null,
      pushUp,
      sitUp,
      flexibility: flex,
      agility,
      endurance,
    });
  }
  return students;
}

function parseResultsFile(filePath, gender, stageFromFile) {
  const wb = XLSX.readFile(filePath);
  const all = [];
  for (const sheetName of wb.SheetNames) {
    if (!sheetName.trim().toUpperCase().startsWith('FINAL')) continue;
    all.push(...parseFinalSheet(wb.Sheets[sheetName], gender, stageFromFile));
  }
  return all;
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
    const list = parseResultsFile(fpath, src.gender, stage);
    console.log(`   → ${list.length} students`);
    allStudents.push(...list);
  }
}

console.log('\n📊 TOTAL:', allStudents.length);
const byStage = {}, byGender = {};
for (const s of allStudents) {
  byStage[s.stage]   = (byStage[s.stage]   || 0) + 1;
  byGender[s.gender] = (byGender[s.gender] || 0) + 1;
}
console.log('By stage:', byStage);
console.log('By gender:', byGender);

const outPath = path.resolve(__dirname, '..', 'src', 'data', 'results2025.json');
fs.writeFileSync(outPath, JSON.stringify({
  academicYear: '2024-2025',
  generatedAt: new Date().toISOString(),
  count: allStudents.length,
  students: allStudents,
}, null, 2), 'utf8');
console.log('\n✅ Wrote', outPath);
