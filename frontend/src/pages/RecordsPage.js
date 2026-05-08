import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getSchoolDisplayName } from "@/lib/schoolUtils";
import { Trophy, Dumbbell, Heart, Ruler, Zap, Timer, ChevronRight, Medal, School, Calendar } from "lucide-react";

/* ══════════════════════════════════════════════
   بيانات الفائزين الحقيقية — برنامج اللياقة البدنية والصحة قطر
   المصدر: النتائج النهائية المعتمدة 2008 – 2016
   ══════════════════════════════════════════════ */
const HISTORICAL_WINNERS = {
  بنين: [
    { year: 2016, gold: { name: "خير أمين أبو أصبع",      school: "خليفة النموذجية" },                      silver: { name: "البراء عبد الرحمن المهدي",  school: "الخليج العربي النموذجية" },          bronze: { name: "محمد طاهر سمير",            school: "القدس النموذجية" } },
    { year: 2015, gold: { name: "جلال دارس معصار",         school: "خليفة النموذجية" },                      silver: { name: "خالد فيصل عبدالوهاب",       school: "ابن الهيثم الابتدائية للبنين" },    bronze: { name: "احمد المبشر عبده",          school: "احمد منصور الابتدائية للبنين" } },
    { year: 2014, gold: { name: "يوسف محمد سعيد",          school: "جابر بن حيان الابتدائية" },              silver: { name: "محمد عادل نظر",             school: "قطر الابتدائية للبنين" },           bronze: { name: "معين عثمان العبدلي",        school: "ابن الهيثم الابتدائية للبنين" } },
    { year: 2013, gold: { name: "حسان محمد الشرقاوى",      school: "عبدالرحمن بن جاسم الإعدادية للبنين" },  silver: { name: "محمد أحمد البعد الله",      school: "اليرموك الإعدادية" },               bronze: { name: "محمد كمال حسن",             school: "خالد بن احمد الإعدادية للبنين" } },
    { year: 2012, gold: { name: "الياس محمد حسن",           school: "المعهد الديني الإعدادي بنين" },          silver: { name: "حازم محمد الشرقاوى",        school: "عبدالرحمن بن جاسم الإعدادية للبنين" }, bronze: { name: "كرم احمد الزيتاوي",      school: "ابن خلدون الإعدادية للبنين" } },
    { year: 2011, gold: { name: "ريان بطرون",               school: "عبدالرحمن بن عوف الإعدادية للبنين" },   silver: { name: "قيس محمد صالح",             school: "خالد بن احمد الإعدادية للبنين" },  bronze: { name: "حافظ رياض حافظ",           school: "المعهد الديني الإعدادي بنين" } },
    { year: 2010, gold: { name: "عمر مختار قرني",           school: "احمد بن حنبل الثانوية للبنين" },        silver: { name: "ابوبكر عبدالعزيز دين",      school: "حمزة بن عبد المطلب الإعدادية" },   bronze: { name: "محمد سعيد مبخوت",          school: "مسعيد الإعدادية" } },
    { year: 2009, gold: { name: "عبدالله نايف تلايف",       school: "المعهد الديني الثانوي للبنين" },         silver: { name: "محمد طارق نعيم",            school: "ابن تيمية الثانوية" },              bronze: { name: "جهاد بدرالدين الاسمر",      school: "الدوحة الثانوية للبنين" } },
    { year: 2008, gold: { name: "دهياتوتروري",              school: "المعهد الديني الثانوي للبنين" },         silver: { name: "ياسر عرفي",                 school: "أحمد بن حنبل الثانوية للبنين" },   bronze: { name: "سلمان علي امين",           school: "الدوحة الثانوية للبنين" } },
  ],
  بنات: [
    { year: 2016, gold: { name: "ألاء أسامة",              school: "الشمال الابتدائية" },                    silver: { name: "سحاب راشد المري",           school: "السلام الابتدائية" },               bronze: { name: "عائشة محمود عبد الله",     school: "الغويرية المشتركة" } },
    { year: 2015, gold: { name: "المها جار الله",           school: "السلام الابتدائية" },                    silver: { name: "شيخة حمد آل ثاني",          school: "الغويرية المشتركة" },               bronze: { name: "عائشة سالم المري",          school: "الخوارزمي الابتدائية" } },
    { year: 2014, gold: { name: "جودي ناجي",               school: "العبيب الابتدائية للبنات" },             silver: { name: "ليلى حمد بامؤمن",           school: "الخوارزمي الابتدائية" },            bronze: { name: "مريم زيدان",               school: "بروق الابتدائية" } },
    { year: 2013, gold: { name: "لجين الاسعد العويني",      school: "الأقصى الإعدادية للبنات" },             silver: { name: "ترف كاظم الفهيدي",          school: "الوكرة الإعدادية للبنات" },         bronze: { name: "خديجة إيهاب محمد",         school: "سمية الابتدائية للبنات" } },
    { year: 2012, gold: { name: "الريم عبد الله",           school: "زينب الإعدادية" },                       silver: { name: "بيان أنور إبراهيم",         school: "الوكرة الإعدادية للبنات" },         bronze: { name: "فاطمة ناصر القحطاني",      school: "الظعاين الإعدادية للبنات" } },
    { year: 2011, gold: { name: "دعاء محمد",               school: "زينب الإعدادية" },                       silver: { name: "توبة مبين",                 school: "الوكرة الإعدادية للبنات" },         bronze: { name: "نوف عبد الرحمن أمانت",     school: "رفيدة بنت كعب الإعدادية" } },
    { year: 2010, gold: { name: "جنى حسام الصادي",          school: "آمنة بنت الأرقم الثانوية" },            silver: { name: "مريم المناعي",              school: "قطر التقنية الثانوية" },            bronze: { name: "ميرة خليل الشبول",         school: "قطر الثانوية" } },
    { year: 2009, gold: { name: "سارة بنت شمس",            school: "امنة بنت وهب الثانوية بنات" },          silver: { name: "صفية محمد",                 school: "الوكرة الثانوية" },                 bronze: { name: "مريم وحيد طرَش",           school: "الشيماء الثانوية" } },
    { year: 2008, gold: { name: "دانه محمد الفادني",        school: "رملة بنت ابي سفيان" },                  silver: { name: "نورة علي محسن",             school: "هند بنت ابي سفيان الثانوية" },     bronze: { name: "تبيان محمد الطيب",         school: "روضة بنت جاسم الثانوية" } },
  ],
};

const MEDALS = [
  { key: "gold",   label: "المركز الأول",  emoji: "🥇", bg: "bg-amber-50",   border: "border-amber-300",  text: "text-amber-700",   num: "text-amber-600",  badge: "bg-amber-100 text-amber-700" },
  { key: "silver", label: "المركز الثاني", emoji: "🥈", bg: "bg-slate-50",   border: "border-slate-300",  text: "text-slate-700",   num: "text-slate-500",  badge: "bg-slate-100 text-slate-600" },
  { key: "bronze", label: "المركز الثالث", emoji: "🥉", bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-700",  num: "text-orange-500", badge: "bg-orange-100 text-orange-700" },
];

function HistoricalSection() {
  const years = HISTORICAL_WINNERS["بنين"].map(r => r.year);
  const [gender, setGender] = useState("بنين");
  const [year, setYear]     = useState(years[0]);

  const row = HISTORICAL_WINNERS[gender].find(r => r.year === year);

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-[#8A1538]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A] font-['Alexandria']">نتائج الأعوام السابقة</h2>
          <p className="text-xs text-[#9CA3AF]">الفائزون بمسابقة اللياقة البدنية والصحة · 2008 – 2016</p>
        </div>
        <span className="mr-auto text-xs px-2.5 py-1 rounded-full bg-[#8A1538]/8 text-[#8A1538] font-semibold border border-[#8A1538]/15">
          🇶🇦 وزارة التربية والتعليم
        </span>
      </div>

      {/* Gender toggle */}
      <div className="inline-flex rounded-xl border border-[#E5E1D8] bg-[#FDFBF7] p-1 gap-1">
        {["بنين", "بنات"].map(g => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              gender === g
                ? "bg-[#8A1538] text-white shadow-sm"
                : "text-[#6B7280] hover:text-[#8A1538]"
            }`}
          >
            {g === "بنين" ? "👦" : "👧"} {g}
          </button>
        ))}
      </div>

      {/* Year tabs */}
      <div className="flex flex-wrap gap-2" dir="rtl">
        {years.map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
              year === y
                ? "bg-[#8A1538] text-white border-[#8A1538] shadow-sm"
                : "bg-white text-[#6B7280] border-[#E5E1D8] hover:border-[#8A1538] hover:text-[#8A1538]"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Medal cards */}
      {row && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MEDALS.map(medal => {
            const winner = row[medal.key];
            return (
              <div
                key={medal.key}
                className={`rounded-2xl border-2 p-5 ${medal.bg} ${medal.border} flex flex-col gap-3`}
              >
                {/* Medal badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${medal.badge}`}>
                    {medal.label}
                  </span>
                  <span className="text-3xl">{medal.emoji}</span>
                </div>

                {/* Winner name */}
                <div>
                  <p className={`text-lg font-black leading-tight ${medal.text} font-['Alexandria']`}>
                    {winner.name}
                  </p>
                </div>

                {/* School */}
                <div className="flex items-start gap-1.5 mt-auto pt-3 border-t border-black/5">
                  <School className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${medal.num}`} />
                  <p className={`text-xs leading-relaxed ${medal.num} font-medium`}>
                    {winner.school}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary strip */}
      <div className="rounded-xl bg-[#FDFBF7] border border-[#E5E1D8] p-4">
        <p className="text-xs text-[#9CA3AF] text-center">
          إجمالي السنوات المسجلة: <strong className="text-[#8A1538]">{years.length} أعوام</strong> ·
          الفترة: <strong className="text-[#1A1A1A]">2008 – 2016</strong> ·
          المصدر: <strong className="text-[#1A1A1A]">النتائج النهائية المعتمدة — برنامج اللياقة البدنية والصحة</strong>
        </p>
      </div>
    </div>
  );
}

const TESTS = [
  { key: "pushUpScore",      label: "اختبار الضغط",   unit: "تكرار", icon: Dumbbell, color: "#8A1538", lowerBetter: false },
  { key: "sitUpScore",       label: "اختبار البطن",   unit: "تكرار", icon: Heart,    color: "#D4AF37", lowerBetter: false },
  { key: "flexibilityScore", label: "اختبار المرونة", unit: "سم",    icon: Ruler,    color: "#10B981", lowerBetter: false },
  { key: "agilityScore",     label: "اختبار الرشاقة", unit: "ثانية", icon: Zap,      color: "#3B82F6", lowerBetter: true  },
  { key: "enduranceScore",   label: "اختبار التحمل",  unit: "دقيقة", icon: Timer,    color: "#8B5CF6", lowerBetter: false },
];

const STAGES = ["ابتدائي", "إعدادي", "ثانوي"];

export default function RecordsPage() {
  const navigate = useNavigate();
  const studentsRaw = useQuery(api.students.list);
  const schoolsRaw  = useQuery(api.schools.list);

  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedStage,  setSelectedStage]  = useState(null);

  const schools = useMemo(() => schoolsRaw || [], [schoolsRaw]);
  const students = useMemo(() => studentsRaw || [], [studentsRaw]);

  const schoolGenderMap = useMemo(() => {
    const map = {};
    schools.forEach(s => { map[s._id] = s.gender; });
    return map;
  }, [schools]);

  const filteredStudents = useMemo(() => {
    if (!selectedGender || !selectedStage) return [];
    return students.filter(st => {
      const gender = schoolGenderMap[st.schoolId];
      return gender === selectedGender && st.stage === selectedStage;
    });
  }, [students, selectedGender, selectedStage, schoolGenderMap]);

  const records = useMemo(() => {
    return TESTS.map(test => {
      const scored = filteredStudents.filter(s => s[test.key] != null && s[test.key] > 0);
      if (scored.length === 0) return { ...test, holder: null };
      const holder = test.lowerBetter
        ? scored.reduce((a, b) => a[test.key] < b[test.key] ? a : b)
        : scored.reduce((a, b) => a[test.key] > b[test.key] ? a : b);
      return { ...test, holder };
    });
  }, [filteredStudents]);

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setSelectedStage(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl" data-testid="records-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-['Alexandria']">الأرقام القياسية</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">أفضل النتائج المسجلة في كل اختبار</p>
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedGender || selectedStage) && (
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]" dir="rtl">
          <button onClick={() => { setSelectedGender(null); setSelectedStage(null); }}
            className="hover:text-[#8A1538] transition-colors">الأرقام القياسية</button>
          {selectedGender && (
            <>
              <ChevronRight className="w-4 h-4 rotate-180" />
              <button onClick={() => setSelectedStage(null)} className="hover:text-[#8A1538] transition-colors">
                {selectedGender}
              </button>
            </>
          )}
          {selectedStage && (
            <>
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="text-[#1A1A1A] font-medium">{selectedStage}</span>
            </>
          )}
        </div>
      )}

      {/* ════ Historical Winners Section ════ */}
      <div className="rounded-2xl border border-[#E5E1D8] bg-white p-6 shadow-sm">
        <HistoricalSection />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E5E1D8]" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8A1538]/8 border border-[#8A1538]/15">
          <Trophy className="w-3.5 h-3.5 text-[#8A1538]" />
          <span className="text-xs font-bold text-[#8A1538]">الأرقام القياسية الحالية</span>
        </div>
        <div className="flex-1 h-px bg-[#E5E1D8]" />
      </div>

      {/* Step 1: Gender */}
      {!selectedGender && (
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[#4B5563] mb-4">اختر النوع لعرض الأرقام القياسية</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "بنين", emoji: "👦", desc: "أرقام قياسية البنين" },
                { value: "بنات", emoji: "👧", desc: "أرقام قياسية البنات" },
              ].map(g => (
                <button key={g.value} onClick={() => handleGenderSelect(g.value)}
                  className="group p-6 rounded-xl border-2 border-[#E5E1D8] hover:border-[#8A1538] hover:bg-[#8A1538]/5 transition-all text-center">
                  <div className="text-4xl mb-3">{g.emoji}</div>
                  <p className="font-bold text-lg text-[#1A1A1A] font-['Alexandria']">{g.value}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{g.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Stage */}
      {selectedGender && !selectedStage && (
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[#4B5563] mb-4">
              اختر المرحلة — {selectedGender === "بنين" ? "👦" : "👧"} {selectedGender}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {STAGES.map((stage, i) => {
                const emojis = ["🏫", "📚", "🎓"];
                const count = students.filter(st =>
                  schoolGenderMap[st.schoolId] === selectedGender && st.stage === stage &&
                  TESTS.some(t => st[t.key] != null && st[t.key] > 0)
                ).length;
                return (
                  <button key={stage} onClick={() => setSelectedStage(stage)}
                    className="p-5 rounded-xl border-2 border-[#E5E1D8] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-center">
                    <div className="text-3xl mb-2">{emojis[i]}</div>
                    <p className="font-bold text-[#1A1A1A] font-['Alexandria']">{stage}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{count} طالب بنتائج</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Records */}
      {selectedGender && selectedStage && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#9CA3AF]">
              {filteredStudents.length} طالب في {selectedStage} - {selectedGender}
            </p>
          </div>

          {filteredStudents.length === 0 ? (
            <Card className="border-[#E5E1D8]">
              <CardContent className="p-10 text-center">
                <Trophy className="w-10 h-10 mx-auto mb-3 text-[#E5E1D8]" />
                <p className="text-[#9CA3AF]">لا توجد نتائج مسجلة لهذه الفئة بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {records.map((test) => {
                const Icon = test.icon;
                return (
                  <Card key={test.key}
                    className={`border-2 transition-all ${test.holder ? "border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:shadow-md" : "border-[#E5E1D8]"}`}>
                    <CardContent className="p-5">
                      {/* Test header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: test.color + "15" }}>
                          <Icon className="w-5 h-5" style={{ color: test.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A1A] text-sm">{test.label}</p>
                          <p className="text-xs text-[#9CA3AF]">{test.unit}</p>
                        </div>
                        {test.lowerBetter && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 mr-auto">↓ أقل أفضل</span>
                        )}
                      </div>

                      {test.holder ? (
                        <>
                          {/* Record value */}
                          <div className="text-center py-3 rounded-lg mb-3"
                            style={{ backgroundColor: test.color + "08" }}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Trophy className="w-4 h-4 text-[#D4AF37]" />
                              <span className="text-[10px] text-[#D4AF37] font-semibold">الرقم القياسي</span>
                            </div>
                            <p className="text-3xl font-black" style={{ color: test.color }} dir="ltr">
                              {test.holder[test.key]}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{test.unit}</p>
                          </div>

                          {/* Record holder */}
                          <div
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E5E1D8] cursor-pointer hover:bg-[#F5F3EC] transition-colors"
                            onClick={() => navigate(`/students/${test.holder._id}`)}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#8A1538]/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-[#8A1538]">
                                {test.holder.fullName?.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{test.holder.fullName}</p>
                              <p className="text-[11px] text-[#9CA3AF] truncate">
                                {getSchoolDisplayName(test.holder.schoolName)} · {test.holder.grade}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0 rotate-180" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-[#9CA3AF] text-sm">لا توجد نتائج</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
