import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getSchoolDisplayName } from "@/lib/schoolUtils";
import { Trophy, Dumbbell, Heart, Ruler, Zap, Timer, ChevronRight } from "lucide-react";

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
  const students = useQuery(api.students.list) || [];
  const schools  = useQuery(api.schools.list)  || [];

  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedStage,  setSelectedStage]  = useState(null);

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
    <div className="space-y-6 animate-fade-in max-w-5xl" data-testid="records-page">
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
