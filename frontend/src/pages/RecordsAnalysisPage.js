import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSchoolDisplayName } from "@/lib/schoolUtils";
import {
  Trophy, Search, Filter, Download, Printer, BarChart3,
  School as SchoolIcon, Users, Award, TrendingUp, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from "xlsx";
import { Toaster, toast } from "sonner";
import { runRecordsPipeline, computeRecords, TESTS, STAGES, GENDERS } from "@/lib/recordsAnalysis";
import { getCurrentAcademicYear } from "@/lib/classification";

// نستورد بيانات WINNERS_2024 مباشرة من ملف RecordsPage (مصدر واحد للحقيقة)
import { WINNERS_2024, WINNERS_2025, HISTORICAL_WINNERS } from "@/pages/RecordsPage";
// بيانات النتائج الكاملة لموسم 2025-2026 (176 طالب)
import results2026Data from "@/data/results2026.json";
import results2025Data from "@/data/results2025.json";

// ──────────────────────────────────────────────────────────
// المكوّن الرئيسي
// ──────────────────────────────────────────────────────────
export default function RecordsAnalysisPage() {
  const studentsRaw = useQuery(api.students.list);
  const schoolsRaw  = useQuery(api.schools.list);

  const students = useMemo(() => studentsRaw || [], [studentsRaw]);
  const schools  = useMemo(() => schoolsRaw  || [], [schoolsRaw]);

  // ── Year tab + filters ────────────────────────────────
  const [selectedYear,   setSelectedYear]   = useState("ALL");   // "ALL" | "2025-2026" | "2024-2025" | "2023-2024"
  const [search,         setSearch]         = useState("");
  const [filterStage,    setFilterStage]    = useState("ALL");
  const [filterGender,   setFilterGender]   = useState("ALL");
  const [filterTest,     setFilterTest]     = useState("ALL");
  const [filterSchool,   setFilterSchool]   = useState("ALL");

  // ── حساب الـ pipeline (المصادر مدمجة + تنظيف) ───────
  const loading = studentsRaw === undefined || schoolsRaw === undefined;

  const pipeline = useMemo(() => {
    if (loading) return null;
    return runRecordsPipeline({
      dbStudents: students,
      schools,
      winners2024: WINNERS_2024,
      winners2025: WINNERS_2025,
      winners2026: HISTORICAL_WINNERS,
      results2025: results2025Data,                  // 169 طالب بنتائج تفصيلية (2024-2025)
      results2026: results2026Data,                  // 176 طالب بنتائج تفصيلية
      currentAcademicYear: getCurrentAcademicYear(),
    });
  }, [students, schools, loading]);

  // ── البيانات بعد فلترة السنة المختارة ────────────────
  const yearFilteredEntries = useMemo(() => {
    if (!pipeline) return [];
    if (selectedYear === "ALL") return pipeline.allEntries;
    return pipeline.allEntries.filter(e => e.academicYear === selectedYear);
  }, [pipeline, selectedYear]);

  // إعادة حساب الأرقام القياسية من بيانات السنة المختارة فقط
  const yearRecords = useMemo(() => {
    return computeRecords(yearFilteredEntries);
  }, [yearFilteredEntries]);

  // ── Filtered records (بعد الفلاتر الأخرى) ────────────
  const filteredRecords = useMemo(() => {
    return yearRecords.filter(r => {
      if (!r.holder) return false;
      if (filterStage   !== "ALL" && r.stage   !== filterStage)   return false;
      if (filterGender  !== "ALL" && r.gender  !== filterGender)  return false;
      if (filterTest    !== "ALL" && r.test    !== filterTest)    return false;
      if (filterSchool  !== "ALL" && r.holder.schoolName !== filterSchool) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${r.holder.fullName} ${r.holder.schoolName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [yearRecords, search, filterStage, filterGender, filterTest, filterSchool]);

  // ── قائمة المدارس المتاحة (تتفرّع من السنة المختارة) ──
  const availableSchools = useMemo(() => {
    const set = new Set(yearFilteredEntries.map(e => e.schoolName).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [yearFilteredEntries]);

  // كل السنوات المتاحة في النظام (للـ tabs)
  const availableYears = useMemo(() => {
    if (!pipeline) return [];
    const set = new Set(pipeline.allEntries.map(e => e.academicYear).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [pipeline]);

  const resetFilters = () => {
    setSearch(""); setFilterStage("ALL"); setFilterGender("ALL");
    setFilterTest("ALL"); setFilterSchool("ALL");
  };

  // ── Export ───────────────────────────────────────────
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const rows = filteredRecords.map(r => ({
      "الجنس":           r.gender,
      "المرحلة":         r.stage,
      "الاختبار":        r.testLabel,
      "الرقم القياسي":   r.displayScore,
      "الوحدة":          r.unit,
      "اسم الطالب":      r.holder?.fullName  || "—",
      "المدرسة":         r.holder?.schoolName || "—",
      "السنة الأكاديمية": r.holder?.academicYear || "—",
      "سنة الميلاد":     r.holder?.birthYear || "—",
    }));
    const ws = xlsxUtils.json_to_sheet(rows);
    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, ws, "الأرقام القياسية");
    xlsxWriteFile(wb, `records-${getCurrentAcademicYear()}.xlsx`);
    toast.success("تم تصدير الملف بنجاح");
  };

  const handlePrint = () => window.print();

  // ── Render ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#8A1538]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <Toaster position="top-center" dir="rtl" />

      {/* ── Header ────────────────────────────────── */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
          <Trophy className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-['Alexandria']">
            الأرقام القياسية لمسابقة اللياقة البدنية والصحة
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            تحليل ذكي لأعلى النتائج خلال آخر 3 سنوات أكاديمية — تصنيف ديناميكي حسب سنة الميلاد
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={handleExportExcel} variant="outline" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50">
            <Download className="w-4 h-4 ml-2" />Excel
          </Button>
          <Button onClick={handlePrint} variant="outline" className="border-[#8A1538] text-[#8A1538] hover:bg-[#8A1538]/5">
            <Printer className="w-4 h-4 ml-2" />طباعة
          </Button>
        </div>
      </div>

      {/* ── Year Tabs (مثل قسم نتائج الطلاب) ──────── */}
      <div className="flex flex-wrap items-center gap-2 print:hidden" dir="rtl">
        <span className="text-xs font-bold text-[#9CA3AF] shrink-0">السنة الأكاديمية:</span>
        <div className="inline-flex rounded-xl border border-[#E5E1D8] bg-[#FDFBF7] p-1 gap-1 flex-wrap">
          <YearTab active={selectedYear === "ALL"} onClick={() => setSelectedYear("ALL")} label="كل السنوات" />
          {availableYears.map((y, i) => (
            <YearTab
              key={y}
              active={selectedYear === y}
              onClick={() => setSelectedYear(y)}
              label={i === 0 ? `${y} 🆕` : y}
            />
          ))}
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users}        color="#8A1538" label={selectedYear === "ALL" ? "إجمالي السجلات" : `سجلات ${selectedYear}`}
                                                    value={yearFilteredEntries.length} />
        <KpiCard icon={Award}        color="#D4AF37" label="أرقام قياسية مسجلة" value={filteredRecords.length} />
        <KpiCard icon={SchoolIcon}   color="#10B981" label="عدد المدارس"        value={availableSchools.length} />
        <KpiCard icon={TrendingUp}   color="#8B5CF6" label="سنوات أكاديمية"     value={selectedYear === "ALL" ? availableYears.length : 1} />
      </div>

      {/* ── Filters ───────────────────────────────── */}
      <Card className="border-[#E5E1D8] print:hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8A1538]" />
            <p className="text-sm font-bold text-[#1A1A1A] font-['Alexandria']">الفلاتر</p>
            <Button onClick={resetFilters} size="sm" variant="ghost" className="mr-auto text-xs text-[#9CA3AF]">
              مسح الفلاتر
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2 lg:col-span-3">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث باسم الطالب أو المدرسة..."
                className="pr-9"
              />
            </div>

            <FilterSelect label="الجنس"      value={filterGender} onChange={setFilterGender}
              options={[{ value: "ALL", label: "الكل" }, ...GENDERS.map(g => ({ value: g, label: g }))]} />

            <FilterSelect label="المرحلة"    value={filterStage}  onChange={setFilterStage}
              options={[{ value: "ALL", label: "الكل" }, ...STAGES.map(s => ({ value: s, label: s }))]} />

            <FilterSelect label="الاختبار"   value={filterTest}   onChange={setFilterTest}
              options={[{ value: "ALL", label: "الكل" }, ...TESTS.map(t => ({ value: t.key, label: t.label }))]} />

            <FilterSelect label="المدرسة" value={filterSchool} onChange={setFilterSchool}
              options={[{ value: "ALL", label: "الكل" }, ...availableSchools.map(s => ({ value: s, label: getSchoolDisplayName(s) }))]} />
          </div>
        </CardContent>
      </Card>

      {/* ── Records Grid (مجمّع حسب الجنس × المرحلة) ── */}
      {filteredRecords.length > 0 && (
        <div>
          <SectionHeader icon={Trophy} title="الأرقام القياسية (بنتائج رقمية)" />
          <RecordsGrouped records={filteredRecords} />
        </div>
      )}

      {/* ── Champions (بدون أرقام رقمية) ─────────────── */}
      <ChampionsByAgeGroup
        entries={yearFilteredEntries}
        search={search}
        filterStage={filterStage}
        filterGender={filterGender}
        filterSchool={filterSchool}
        selectedYear={selectedYear}
      />

      {/* لو مفيش بيانات أصلاً */}
      {filteredRecords.length === 0 && yearFilteredEntries.length === 0 && (
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-12 text-center">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-[#E5E1D8]" />
            <p className="text-[#9CA3AF]">لا توجد بيانات مطابقة للفلاتر</p>
          </CardContent>
        </Card>
      )}

      {/* ── Charts ────────────────────────────────── */}
      {filteredRecords.length > 0 && (
        <Card className="border-[#E5E1D8] print:hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#8A1538]" />
              <p className="text-base font-bold text-[#1A1A1A] font-['Alexandria']">
                مقارنة الأرقام القياسية حسب الاختبار
              </p>
            </div>
            <RecordsChart records={filteredRecords} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// Section header (يستخدم في أعلى أقسام الصفحة)
// ─────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-2">
      <div className="w-8 h-8 rounded-lg bg-[#8A1538]/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#8A1538]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[#1A1A1A] font-['Alexandria']">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#9CA3AF]">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// أبطال الفئات العمرية — للسنين بدون أرقام رقمية
// ─────────────────────────────────────────────────────────
const MEDAL_META = {
  gold:   { label: "المركز الأول",  emoji: "🥇", bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-700",  badge: "bg-amber-100 text-amber-700"  },
  silver: { label: "المركز الثاني", emoji: "🥈", bg: "bg-slate-50",  border: "border-slate-300",  text: "text-slate-700",  badge: "bg-slate-100 text-slate-600"  },
  bronze: { label: "المركز الثالث", emoji: "🥉", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
};

function ChampionsByAgeGroup({ entries, search, filterStage, filterGender, filterSchool, selectedYear }) {
  // طاللب بنفس فلاتر الصفحة + entries فيها medalRank فقط (مصادر بدون scores)
  const filteredChampions = useMemo(() => {
    return entries.filter(e => {
      if (!e.medalRank) return false;                      // مش بطل (لا تظهر صفوف الـ DB هنا)
      if (filterStage  !== "ALL" && e.stage  !== filterStage)  return false;
      if (filterGender !== "ALL" && e.gender !== filterGender) return false;
      if (filterSchool !== "ALL" && e.schoolName !== filterSchool) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.fullName} ${e.schoolName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, filterStage, filterGender, filterSchool]);

  // Group: السنة الأكاديمية → الجنس → سنة الميلاد → الميداليات
  const grouped = useMemo(() => {
    const out = {};
    for (const e of filteredChampions) {
      const yr = e.academicYear || "—";
      const g  = e.gender;
      const by = e.birthYear || "؟";
      if (!out[yr]) out[yr] = {};
      if (!out[yr][g]) out[yr][g] = {};
      if (!out[yr][g][by]) out[yr][g][by] = {};
      out[yr][g][by][e.medalRank] = e;
    }
    return out;
  }, [filteredChampions]);

  if (filteredChampions.length === 0) return null;

  const orderedYears   = Object.keys(grouped).sort().reverse();
  const orderedGenders = ["بنين", "بنات"];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Award}
        title="أبطال الفئات العمرية"
        subtitle="الفائزون حسب سنة الميلاد للمواسم اللي بياناتها بدون أرقام رقمية تفصيلية"
      />

      {orderedYears.map(year => (
        <div key={year} className="space-y-4">
          {selectedYear === "ALL" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#8A1538]/8 text-[#8A1538] border border-[#8A1538]/15">
                موسم {year}
              </span>
              <div className="h-px flex-1 bg-[#E5E1D8]" />
            </div>
          )}

          {orderedGenders.map(gender => {
            const byBirthYear = grouped[year]?.[gender];
            if (!byBirthYear) return null;
            const orderedBirthYears = Object.keys(byBirthYear).sort();

            return (
              <div key={gender} className="space-y-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                  gender === "بنين" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                }`}>
                  <span className="text-base">{gender === "بنين" ? "👦" : "👧"}</span>{gender}
                </span>

                {orderedBirthYears.map(by => {
                  const medals = byBirthYear[by];
                  return (
                    <div key={by} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-[#E5E1D8]" />
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#8A6B0F] border border-[#D4AF37]/20 whitespace-nowrap">
                          مواليد {by}
                        </span>
                        <div className="h-px flex-1 bg-[#E5E1D8]" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {["gold", "silver", "bronze"].map(m => {
                          const winner = medals[m];
                          if (!winner) return <div key={m} />;
                          const meta = MEDAL_META[m];
                          return (
                            <div key={m} className={`rounded-xl border-2 ${meta.bg} ${meta.border} p-3 flex flex-col gap-1.5`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                                <span className="text-xl">{meta.emoji}</span>
                              </div>
                              <p className={`text-sm font-black leading-tight ${meta.text}`}>{winner.fullName}</p>
                              <p className="text-[10px] text-[#9CA3AF] truncate">{getSchoolDisplayName(winner.schoolName)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Grouped records: 6 sections (2 جنس × 3 مراحل)
// ─────────────────────────────────────────────────────────
function RecordsGrouped({ records }) {
  // Group: gender → stage → records[]
  const grouped = useMemo(() => {
    const map = {};
    for (const r of records) {
      const gKey = r.gender;
      const sKey = r.stage;
      if (!map[gKey]) map[gKey] = {};
      if (!map[gKey][sKey]) map[gKey][sKey] = [];
      map[gKey][sKey].push(r);
    }
    return map;
  }, [records]);

  const STAGE_META = {
    "ابتدائي": { emoji: "🏫", color: "#10B981", bg: "bg-emerald-50", border: "border-emerald-200" },
    "إعدادي":  { emoji: "📚", color: "#D4AF37", bg: "bg-amber-50",   border: "border-amber-200"   },
    "ثانوي":   { emoji: "🎓", color: "#8A1538", bg: "bg-rose-50",    border: "border-rose-200"    },
  };
  const GENDER_META = {
    "بنين": { emoji: "👦", chipBg: "bg-blue-50",  chipText: "text-blue-700" },
    "بنات": { emoji: "👧", chipBg: "bg-pink-50",  chipText: "text-pink-700" },
  };

  const ORDERED_GENDERS = GENDERS.filter(g => grouped[g]);
  const ORDERED_STAGES  = STAGES;

  return (
    <div className="space-y-6">
      {ORDERED_GENDERS.map(gender => {
        const gMeta = GENDER_META[gender];
        return (
          <div key={gender} className="space-y-3">
            {/* Gender header */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${gMeta.chipBg} ${gMeta.chipText} border border-current/15`}>
                <span className="text-base">{gMeta.emoji}</span>{gender}
              </span>
              <div className="h-px flex-1 bg-[#E5E1D8]" />
            </div>

            {/* Stages cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {ORDERED_STAGES.map(stage => {
                const stageRecords = grouped[gender]?.[stage] || [];
                if (stageRecords.length === 0) return null;
                const sMeta = STAGE_META[stage];

                return (
                  <Card key={stage} className={`border-2 ${sMeta.border} ${sMeta.bg}`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Stage header */}
                      <div className="flex items-center justify-between border-b border-black/5 pb-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: sMeta.color }}>
                          <span className="text-lg">{sMeta.emoji}</span>{stage}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">{stageRecords.length} رقم قياسي</span>
                      </div>

                      {/* Records list */}
                      <div className="space-y-2">
                        {stageRecords.map(r => (
                          <RecordItem key={`${r.test}-${r.stage}-${r.gender}`} record={r} accentColor={sMeta.color} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecordItem({ record: r, accentColor }) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E1D8] p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-[#4B5563]">{r.testLabel}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
              style={{ backgroundColor: accentColor + "15", color: accentColor }}>
          <Trophy className="w-3 h-3" />
          <span dir="ltr">{r.displayScore}</span>
          <span className="text-[9px] font-normal opacity-70">{r.unit}</span>
        </span>
      </div>
      <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">{r.holder?.fullName}</p>
      <p className="text-[10px] text-[#9CA3AF] mt-1 truncate">
        {getSchoolDisplayName(r.holder?.schoolName)} · {r.holder?.academicYear || "—"}
      </p>
    </div>
  );
}

function YearTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
        active
          ? "bg-[#8A1538] text-white shadow-sm"
          : "text-[#6B7280] hover:bg-white hover:text-[#8A1538]"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({ icon: Icon, color, label, value }) {
  return (
    <div className="rounded-xl border border-[#E5E1D8] bg-white p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + "15" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-[#9CA3AF] font-medium truncate">{label}</p>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <p className="text-xs text-[#9CA3AF] mb-1 font-medium">{label}</p>
      <Select value={value} onValueChange={onChange} dir="rtl">
        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function RecordsChart({ records }) {
  // تجميع للعرض: لكل اختبار، نعرض bar للذكور وللإناث
  const data = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (!r.holder) continue;
      if (!map[r.testLabel]) map[r.testLabel] = { test: r.testLabel };
      const key = `${r.gender}-${r.stage}`;
      const current = map[r.testLabel][key];
      const score   = r.score;
      if (current == null || (r.lowerBetter ? score < current : score > current)) {
        map[r.testLabel][key] = score;
      }
    }
    return Object.values(map);
  }, [records]);

  const allKeys = useMemo(() => {
    const set = new Set();
    for (const row of data) {
      for (const k of Object.keys(row)) if (k !== "test") set.add(k);
    }
    return Array.from(set);
  }, [data]);

  const COLORS = ["#8A1538", "#D4AF37", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

  if (data.length === 0) {
    return <p className="text-center text-[#9CA3AF] py-8 text-sm">لا توجد بيانات للرسم</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
        <XAxis dataKey="test" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {allKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
