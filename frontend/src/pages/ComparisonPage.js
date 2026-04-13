import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Trophy, Medal, Award, TrendingUp, Dumbbell, Heart, Ruler, Zap, Timer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const TEST_CONFIG = [
  { key: "pushUpScore", label: "الضغط", unit: "مرة", icon: Dumbbell, color: "#8A1538" },
  { key: "sitUpScore", label: "البطن", unit: "مرة", icon: Heart, color: "#D4AF37" },
  { key: "flexibilityScore", label: "المرونة", unit: "سم", icon: Ruler, color: "#10B981" },
  { key: "agilityScore", label: "الرشاقة", unit: "ثانية", icon: Zap, color: "#3B82F6", lowerBetter: true },
  { key: "enduranceScore", label: "التحمل", unit: "دقيقة", icon: Timer, color: "#8B5CF6" },
];

const RANK_ICONS = [Trophy, Medal, Award];
const RANK_COLORS = ["text-[#D4AF37]", "text-[#9CA3AF]", "text-[#CD7F32]"];
const RANK_BG = ["bg-[#D4AF37]/10 border-[#D4AF37]/30", "bg-gray-100 border-gray-200", "bg-orange-50 border-orange-200"];

function calcSchoolStats(schools, students) {
  return schools.map(school => {
    const schoolStudents = students.filter(s => s.schoolId === school._id);
    const count = schoolStudents.length;
    if (count === 0) return { ...school, stats: null, studentCount: 0, totalScore: 0 };

    const stats = {};
    let totalScore = 0;
    TEST_CONFIG.forEach(t => {
      const values = schoolStudents.map(s => s[t.key]).filter(v => v != null && v > 0);
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      stats[t.key] = { avg: parseFloat(avg.toFixed(1)), max, min, count: values.length };
      totalScore += t.lowerBetter ? (avg > 0 ? 100 / avg : 0) : avg;
    });

    const bmiValues = schoolStudents.map(s => s.bmi).filter(v => v != null);
    const avgBmi = bmiValues.length > 0 ? bmiValues.reduce((a, b) => a + b, 0) / bmiValues.length : 0;

    return { ...school, stats, studentCount: count, totalScore: parseFloat(totalScore.toFixed(1)), avgBmi: parseFloat(avgBmi.toFixed(1)) };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-lg shadow-lg p-3 text-sm" dir="rtl">
      <p className="font-semibold text-[#1A1A1A] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function ComparisonPage() {
  const navigate = useNavigate();
  const schools = useQuery(api.schools.list) || [];
  const students = useQuery(api.students.list) || [];

  const rankedSchools = useMemo(() => calcSchoolStats(schools, students), [schools, students]);
  const schoolsWithStudents = rankedSchools.filter(s => s.studentCount > 0);
  const hasData = schoolsWithStudents.length > 0;

  const barChartData = useMemo(() => {
    return TEST_CONFIG.map(t => {
      const row = { name: t.label };
      schoolsWithStudents.forEach(s => {
        row[s.name] = s.stats?.[t.key]?.avg || 0;
      });
      return row;
    });
  }, [schoolsWithStudents]);

  const radarData = useMemo(() => {
    if (!hasData) return [];
    const maxPerTest = {};
    TEST_CONFIG.forEach(t => {
      const allAvgs = schoolsWithStudents.map(s => s.stats?.[t.key]?.avg || 0);
      maxPerTest[t.key] = Math.max(...allAvgs, 1);
    });
    return TEST_CONFIG.map(t => {
      const row = { test: t.label };
      schoolsWithStudents.forEach(s => {
        const avg = s.stats?.[t.key]?.avg || 0;
        row[s.name] = t.lowerBetter
          ? parseFloat(((maxPerTest[t.key] > 0 ? (maxPerTest[t.key] - avg + 1) / maxPerTest[t.key] : 0) * 100).toFixed(0))
          : parseFloat(((avg / maxPerTest[t.key]) * 100).toFixed(0));
      });
      return row;
    });
  }, [schoolsWithStudents, hasData]);

  const SCHOOL_COLORS = ["#8A1538", "#D4AF37", "#10B981", "#3B82F6", "#8B5CF6"];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="comparison-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="back-btn">
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-['Alexandria']">مقارنة المدارس</h1>
            <p className="text-sm text-[#9CA3AF]">تحليل ومقارنة نتائج اللياقة البدنية بين المدارس</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-sm font-medium text-[#4B5563]">{schoolsWithStudents.length} مدارس لديها بيانات</span>
        </div>
      </div>

      {!hasData ? (
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-[#E5E1D8]" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">لا توجد بيانات للمقارنة</h3>
            <p className="text-sm text-[#9CA3AF] mb-4">قم بتسجيل طلاب مع نتائج اختباراتهم البدنية أولاً</p>
            <Button onClick={() => navigate("/students/new")} data-testid="add-student-cta" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">
              تسجيل طالب جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Rankings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolsWithStudents.map((school, idx) => {
              const RankIcon = RANK_ICONS[idx] || Award;
              return (
                <Card key={school._id} className={`border overflow-hidden cursor-pointer transition-all hover:shadow-md ${idx < 3 ? RANK_BG[idx] : "border-[#E5E1D8]"}`}
                  onClick={() => navigate(`/schools/${school._id}`)} data-testid={`rank-card-${idx}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx < 3 ? "bg-white/80" : "bg-[#F5F3EC]"}`}>
                          <RankIcon className={`w-4 h-4 ${idx < 3 ? RANK_COLORS[idx] : "text-[#9CA3AF]"}`} />
                        </div>
                        <span className="text-2xl font-bold text-[#1A1A1A]" dir="ltr">#{idx + 1}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{school.stage}</span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1">{school.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mb-3">
                      <span>{school.studentCount} طالب</span>
                      <span>BMI: {school.avgBmi}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {TEST_CONFIG.map(t => {
                        const Icon = t.icon;
                        const val = school.stats?.[t.key]?.avg;
                        return (
                          <div key={t.key} className="text-center" title={t.label}>
                            <Icon className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: t.color }} />
                            <p className="text-[10px] font-bold text-[#1A1A1A]" dir="ltr">{val || "-"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="bar" dir="rtl">
            <TabsList className="bg-[#F5F3EC]">
              <TabsTrigger value="bar" data-testid="tab-bar" className="data-[state=active]:bg-[#8A1538] data-[state=active]:text-white">
                مقارنة الاختبارات
              </TabsTrigger>
              <TabsTrigger value="radar" data-testid="tab-radar" className="data-[state=active]:bg-[#8A1538] data-[state=active]:text-white">
                نقاط القوة
              </TabsTrigger>
              <TabsTrigger value="table" data-testid="tab-table" className="data-[state=active]:bg-[#8A1538] data-[state=active]:text-white">
                تفاصيل المقارنة
              </TabsTrigger>
            </TabsList>

            {/* Bar Chart */}
            <TabsContent value="bar" className="mt-4">
              <Card className="border-[#E5E1D8]">
                <CardContent className="p-5">
                  <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">متوسط نتائج الاختبارات حسب المدرسة</h3>
                  <div className="h-[350px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#4B5563" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#4B5563" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        {schoolsWithStudents.map((s, i) => (
                          <Bar key={s._id} dataKey={s.name} fill={SCHOOL_COLORS[i % SCHOOL_COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Radar Chart */}
            <TabsContent value="radar" className="mt-4">
              <Card className="border-[#E5E1D8]">
                <CardContent className="p-5">
                  <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">نقاط القوة لكل مدرسة</h3>
                  <p className="text-xs text-[#9CA3AF] mb-4">النسبة المئوية لأداء كل مدرسة مقارنة بأعلى متوسط في كل اختبار</p>
                  <div className="h-[350px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#E5E1D8" />
                        <PolarAngleAxis dataKey="test" tick={{ fontSize: 12, fill: "#4B5563" }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                        {schoolsWithStudents.map((s, i) => (
                          <Radar key={s._id} name={s.name} dataKey={s.name} stroke={SCHOOL_COLORS[i % SCHOOL_COLORS.length]}
                            fill={SCHOOL_COLORS[i % SCHOOL_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Detailed Table */}
            <TabsContent value="table" className="mt-4">
              <Card className="border-[#E5E1D8] overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#FDFBF7] border-b border-[#E5E1D8]">
                          <th className="text-start p-3 font-semibold text-[#4B5563] sticky right-0 bg-[#FDFBF7] z-10">المدرسة</th>
                          <th className="p-3 font-semibold text-[#4B5563] text-center">الطلاب</th>
                          <th className="p-3 font-semibold text-[#4B5563] text-center">BMI</th>
                          {TEST_CONFIG.map(t => (
                            <th key={t.key} className="p-3 font-semibold text-center whitespace-nowrap" style={{ color: t.color }}>
                              {t.label}
                              <span className="block text-[10px] font-normal text-[#9CA3AF]">{t.unit}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schoolsWithStudents.map((school, idx) => (
                          <tr key={school._id} className="border-b border-[#E5E1D8]/50 hover:bg-[#F5F3EC] transition-colors" data-testid={`compare-row-${school._id}`}>
                            <td className="p-3 sticky right-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#D4AF37]" dir="ltr">#{idx + 1}</span>
                                <div>
                                  <p className="font-medium text-[#1A1A1A]">{school.name}</p>
                                  <span className="text-[10px] text-[#9CA3AF]">{school.stage}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-medium">{school.studentCount}</td>
                            <td className="p-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                school.avgBmi < 18.5 ? "bg-amber-50 text-amber-700" :
                                school.avgBmi < 25 ? "bg-emerald-50 text-emerald-700" :
                                school.avgBmi < 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                              }`}>{school.avgBmi}</span>
                            </td>
                            {TEST_CONFIG.map(t => {
                              const stat = school.stats?.[t.key];
                              const isTopInTest = schoolsWithStudents.every(other =>
                                t.lowerBetter
                                  ? (stat?.avg || Infinity) <= (other.stats?.[t.key]?.avg || Infinity)
                                  : (stat?.avg || 0) >= (other.stats?.[t.key]?.avg || 0)
                              );
                              return (
                                <td key={t.key} className="p-3 text-center">
                                  <div className={`inline-flex flex-col items-center ${isTopInTest ? "font-bold" : ""}`}>
                                    <span className={`text-sm ${isTopInTest ? "text-[#8A1538]" : "text-[#1A1A1A]"}`} dir="ltr">
                                      {stat?.avg || "-"}
                                    </span>
                                    {isTopInTest && stat?.avg > 0 && (
                                      <Trophy className="w-3 h-3 text-[#D4AF37] mt-0.5" />
                                    )}
                                    {stat?.count > 1 && (
                                      <span className="text-[10px] text-[#9CA3AF]" dir="ltr">{stat.min}-{stat.max}</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Per-Test Best School */}
          <Card className="border-[#E5E1D8]">
            <CardContent className="p-5">
              <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">أفضل مدرسة في كل اختبار</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {TEST_CONFIG.map(t => {
                  let bestSchool = null;
                  let bestVal = t.lowerBetter ? Infinity : -1;
                  schoolsWithStudents.forEach(s => {
                    const avg = s.stats?.[t.key]?.avg || 0;
                    if (avg > 0 && (t.lowerBetter ? avg < bestVal : avg > bestVal)) {
                      bestVal = avg;
                      bestSchool = s;
                    }
                  });
                  const Icon = t.icon;
                  return (
                    <div key={t.key} className="p-3 rounded-lg border border-[#E5E1D8] bg-[#FDFBF7] text-center" data-testid={`best-${t.key}`}>
                      <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: t.color }} />
                      <p className="text-xs font-semibold text-[#4B5563] mb-1">{t.label}</p>
                      {bestSchool ? (
                        <>
                          <p className="text-lg font-bold text-[#1A1A1A]" dir="ltr">{bestVal} <span className="text-[10px] font-normal">{t.unit}</span></p>
                          <p className="text-[11px] text-[#8A1538] font-medium mt-1 truncate">{bestSchool.name}</p>
                        </>
                      ) : (
                        <p className="text-xs text-[#9CA3AF]">لا توجد بيانات</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
