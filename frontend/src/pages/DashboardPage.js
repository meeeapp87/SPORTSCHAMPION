import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, CheckCircle, TrendingUp, UserPlus, ArrowLeft, BarChart3, Trophy } from "lucide-react";
import "@/App.css";
import primaryStandards  from "@/data/fitness_standards_primary.json";
import middleStandards   from "@/data/fitness_standards_middle.json";
import secondaryStandards from "@/data/fitness_standards_secondary.json";
import { getSchoolDisplayName } from "@/lib/schoolUtils";

const STAGE_STANDARDS = {
  "ابتدائي": primaryStandards,
  "إعدادي":  middleStandards,
  "ثانوي":   secondaryStandards,
};

function getStandardScore(value, stdKey, stage, gender) {
  if (value == null || value === 0) return null;
  const standards = STAGE_STANDARDS[stage];
  if (!standards) return null;
  const test = standards.tests.find(t => t.key === stdKey);
  if (!test) return null;
  const genderKey = gender === "بنات" ? "girls" : "boys";
  const mappings = test.mappings[genderKey] || [];
  if (!mappings.length) return null;
  if (test.direction === "higher_is_better") {
    const match = mappings.find(m => value >= m.value);
    return match ? match.score : 0;
  } else {
    const match = [...mappings].reverse().find(m => value <= m.value);
    return match ? match.score : 0;
  }
}

function scoreColor(s) {
  if (s == null) return { bar: "#E5E1D8", text: "text-[#9CA3AF]", bg: "bg-gray-100" };
  if (s >= 90) return { bar: "#10B981", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (s >= 75) return { bar: "#3B82F6", text: "text-blue-700",    bg: "bg-blue-50"    };
  if (s >= 60) return { bar: "#D4AF37", text: "text-amber-700",   bg: "bg-amber-50"   };
  if (s >= 40) return { bar: "#F97316", text: "text-orange-700",  bg: "bg-orange-50"  };
  return        { bar: "#EF4444", text: "text-red-700",     bg: "bg-red-50"     };
}

const TOP_TESTS = [
  { field: "pushUpScore",      stdKey: "push_up",     label: "الضغط",   unit: "تكرار" },
  { field: "sitUpScore",       stdKey: "sit_up",      label: "البطن",   unit: "تكرار" },
  { field: "flexibilityScore", stdKey: "flexibility", label: "المرونة", unit: "سم"    },
  { field: "agilityScore",     stdKey: "agility",     label: "الرشاقة", unit: "ث"     },
  { field: "enduranceScore",   stdKey: "endurance",   label: "التحمل",  unit: "د"     },
];

const PAGE_SIZE = 5;

function SchoolsOverview({ schools, students, navigate }) {
  const [showAll, setShowAll] = useState(false);

  // فقط المدارس اللي فيها طلاب، مرتبة تنازلياً حسب عدد الطلاب
  const activeSchools = schools
    .map(s => ({ ...s, count: students.filter(st => st.schoolId === s._id).length }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const displayed = showAll ? activeSchools : activeSchools.slice(0, PAGE_SIZE);

  if (activeSchools.length === 0) {
    return <p className="text-[#9CA3AF] text-center py-8">لا توجد مدارس مسجّل فيها طلاب بعد</p>;
  }

  return (
    <div className="space-y-3">
      {displayed.map(school => {
        const max = school.maxStudents || 3;
        const isFull = school.count >= max;
        const pct = Math.min((school.count / max) * 100, 100);
        return (
          <div key={school._id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F5F3EC] transition-colors cursor-pointer"
            onClick={() => navigate(`/schools/${school._id}`)} data-testid={`school-row-${school._id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-[#1A1A1A] truncate">{getSchoolDisplayName(school.name)}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{school.stage}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E1D8] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isFull ? "bg-emerald-500" : pct > 50 ? "bg-[#D4AF37]" : "bg-[#8A1538]"}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="text-left shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${isFull ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {isFull ? "مكتمل" : `متبقٍ ${max - school.count}`}
              </span>
            </div>
            <ArrowLeft className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          </div>
        );
      })}
      {activeSchools.length > PAGE_SIZE && (
        <button onClick={() => setShowAll(v => !v)}
          className="w-full text-center text-sm text-[#8A1538] hover:text-[#6D102A] py-2 font-medium transition-colors">
          {showAll ? "عرض أقل ▲" : `عرض المزيد (${activeSchools.length - PAGE_SIZE} مدرسة) ▼`}
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const schools  = useQuery(api.schools.list)   || [];
  const students = useQuery(api.students.list)  || [];
  const settings = useQuery(api.settings.getAll) || [];
  const seed = useMutation(api.seed.seedInitialData);

  const [selectedBirthYear, setSelectedBirthYear] = useState(null);

  const totalSchools = schools.length;
  const totalStudents = students.length;
  const completedSchools = schools.filter(s => {
    const count = students.filter(st => st.schoolId === s._id).length;
    return count >= (s.maxStudents || 3);
  }).length;
  const remainingSeats = schools.reduce((acc, s) => {
    const count = students.filter(st => st.schoolId === s._id).length;
    return acc + Math.max(0, (s.maxStudents || 3) - count);
  }, 0);
  const totalSeats = schools.reduce((acc, s) => acc + (s.maxStudents || 3), 0);
  const participationRate = totalSeats > 0 ? Math.round((totalStudents / totalSeats) * 100) : 0;

  const handleSeed = async () => {
    try {
      const result = await seed();
      if (result?.status === "seeded") window.location.reload();
    } catch (e) { console.error(e); }
  };

  const stats = [
    { label: "المدارس", value: totalSchools, icon: School, color: "bg-[#8A1538]", lightColor: "bg-[#8A1538]/5" },
    { label: "الطلاب المسجلين", value: totalStudents, icon: Users, color: "bg-[#D4AF37]", lightColor: "bg-[#D4AF37]/5" },
    { label: "المدارس المكتملة", value: completedSchools, icon: CheckCircle, color: "bg-emerald-600", lightColor: "bg-emerald-50" },
    { label: "نسبة المشاركة", value: `${participationRate}%`, icon: TrendingUp, color: "bg-amber-500", lightColor: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-['Alexandria']">لوحة التحكم</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">مرحباً {user?.name}، إليك ملخص النظام</p>
        </div>
        <div className="flex gap-2">
          {schools.length === 0 && user?.role === "admin" && (
            <Button onClick={handleSeed} data-testid="seed-btn" className="bg-[#D4AF37] hover:bg-[#B5952F] text-white">
              تهيئة البيانات الأولية
            </Button>
          )}
          <Button onClick={() => navigate("/students/new")} data-testid="add-student-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">
            <UserPlus className="w-4 h-4 ml-2" />تسجيل طالب جديد
          </Button>
          {students.length > 0 && (
            <Button onClick={() => navigate("/comparison")} variant="outline" data-testid="comparison-btn" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5">
              <BarChart3 className="w-4 h-4 ml-2" />مقارنة المدارس
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="stat-card border-[#E5E1D8] overflow-hidden" data-testid={`stat-${stat.label}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#9CA3AF] mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.lightColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schools Overview */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4 font-['Alexandria']">حالة المدارس</h3>
          <SchoolsOverview schools={schools} students={students} navigate={navigate} />
        </CardContent>
      </Card>

      {/* Top 3 Students by Birth Year */}
      {(() => {
        const getTotal = (st) =>
          (st.pushUpScore || 0) + (st.sitUpScore || 0) +
          (st.flexibilityScore || 0) + (st.agilityScore || 0) + (st.enduranceScore || 0);

        // كل الطلاب اللي عندهم قياسات
        const scoredStudents = students.filter(st => getTotal(st) > 0);
        if (scoredStudents.length === 0) return null;

        // السنوات الموجودة فعلاً مرتبة تصاعدياً
        const birthYears = [...new Set(scoredStudents.map(st => st.birthYear))]
          .filter(Boolean).sort((a, b) => a - b);
        if (birthYears.length === 0) return null;

        // السنة المختارة (أول سنة بشكل افتراضي)
        const activeYear = selectedBirthYear ?? birthYears[0];

        // أفضل 3 في السنة المختارة
        const topInYear = scoredStudents
          .filter(st => st.birthYear === activeYear)
          .sort((a, b) => getTotal(b) - getTotal(a))
          .slice(0, 3);

        const medalLabels  = ["🥇", "🥈", "🥉"];
        const medalBorders = ["border-[#D4AF37]/50", "border-gray-300", "border-orange-300"];
        const medalBg      = ["bg-[#D4AF37]/5", "bg-gray-50", "bg-orange-50/50"];

        return (
          <Card className="border-[#E5E1D8]">
            <CardContent className="p-5">

              {/* عنوان + تبويبات السنوات */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2 shrink-0">
                  <Trophy className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-semibold text-[#1A1A1A] font-['Alexandria']">أفضل 3 طلاب</h3>
                </div>
                {/* أزرار السنوات */}
                <div className="flex flex-wrap gap-2">
                  {birthYears.map(yr => {
                    const count = scoredStudents.filter(st => st.birthYear === yr).length;
                    const isActive = activeYear === yr;
                    return (
                      <button
                        key={yr}
                        onClick={() => setSelectedBirthYear(yr)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          isActive
                            ? "bg-[#8A1538] text-white border-[#8A1538]"
                            : "bg-white text-[#4B5563] border-[#E5E1D8] hover:border-[#8A1538]/40 hover:text-[#8A1538]"
                        }`}
                      >
                        {yr}
                        <span className={`mr-1 ${isActive ? "text-white/70" : "text-[#9CA3AF]"}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* بطاقات أفضل 3 */}
              {topInYear.length === 0 ? (
                <p className="text-center py-6 text-[#9CA3AF] text-sm">لا يوجد طلاب بقياسات مسجلة لسنة {activeYear}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {topInYear.map((st, i) => {
                    const total = getTotal(st);
                    return (
                      <div key={st._id}
                        className={`rounded-xl border-2 ${medalBorders[i]} ${medalBg[i]} cursor-pointer hover:shadow-md transition-all`}
                        onClick={() => navigate(`/students/${st._id}`)}
                        data-testid={`top-student-${i}`}>

                        {/* Header */}
                        <div className="flex items-center gap-2 p-3 border-b border-[#E5E1D8]/60">
                          <span className="text-xl">{medalLabels[i]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1A1A1A] truncate text-sm">{st.fullName}</p>
                            <p className="text-[11px] text-[#9CA3AF] truncate">
                              {getSchoolDisplayName(st.schoolName)} · {st.stage}
                            </p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-[10px] text-[#9CA3AF]">المجموع</p>
                            <p className="text-base font-bold text-[#8A1538]">{total}</p>
                          </div>
                        </div>

                        {/* Tests rows */}
                        <div className="p-3 space-y-2">
                          {TOP_TESTS.map(t => {
                            const val = st[t.field];
                            const std = getStandardScore(val, t.stdKey, st.stage, st.gender);
                            const clr = scoreColor(std);
                            return (
                              <div key={t.field} className="flex items-center gap-2">
                                <span className="text-[11px] text-[#4B5563] w-12 shrink-0">{t.label}</span>
                                <div className="flex-1 h-2 bg-[#E5E1D8] rounded-full overflow-hidden">
                                  <div className="h-2 rounded-full transition-all"
                                    style={{ width: std != null ? `${std}%` : "0%", backgroundColor: clr.bar }} />
                                </div>
                                <span className="text-[11px] font-semibold text-[#1A1A1A] w-8 text-left shrink-0" dir="ltr">
                                  {val ?? "—"}
                                </span>
                                {std != null ? (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${clr.bg} ${clr.text}`}>
                                    {std}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#9CA3AF] w-9 shrink-0">—</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Recent Students */}
      {students.length > 0 && (
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1A1A1A] font-['Alexandria']">آخر الطلاب المسجلين</h3>
              <Button variant="ghost" onClick={() => navigate("/students")} data-testid="view-all-students-btn" className="text-[#8A1538] hover:text-[#6D102A]">
                عرض الكل
              </Button>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E1D8]">
                    <th className="text-start p-3 font-semibold text-[#4B5563]">الاسم</th>
                    <th className="text-start p-3 font-semibold text-[#4B5563]">المدرسة</th>
                    <th className="text-start p-3 font-semibold text-[#4B5563] hidden sm:table-cell">المرحلة</th>
                    <th className="text-start p-3 font-semibold text-[#4B5563] hidden md:table-cell">BMI</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(-5).reverse().map(st => (
                    <tr key={st._id} className="border-b border-[#E5E1D8]/50 hover:bg-[#F5F3EC] cursor-pointer transition-colors"
                      onClick={() => navigate(`/students/${st._id}`)} data-testid={`recent-student-${st._id}`}>
                      <td className="p-3 font-medium text-[#1A1A1A]">{st.fullName}</td>
                      <td className="p-3 text-[#4B5563]">{getSchoolDisplayName(st.schoolName)}</td>
                      <td className="p-3 text-[#4B5563] hidden sm:table-cell">{st.stage}</td>
                      <td className="p-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          st.bmi < 18.5 ? "bg-amber-50 text-amber-700" :
                          st.bmi < 25 ? "bg-emerald-50 text-emerald-700" :
                          st.bmi < 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                        }`}>{st.bmi?.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
