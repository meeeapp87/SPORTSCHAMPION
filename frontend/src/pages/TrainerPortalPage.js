import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Ruler, Weight, Dumbbell, Heart, Zap, Timer, Save, CheckCircle, AlertCircle, ClipboardList } from "lucide-react";

function calcBMI(h, w) {
  if (!h || !w || h <= 0) return 0;
  return w / ((h / 100) * (h / 100));
}

function getBMICategory(bmi) {
  if (!bmi || bmi <= 0) return null;
  if (bmi < 18.5) return { label: "نقص وزن", cls: "text-[#F59E0B] bg-[#F59E0B]/10" };
  if (bmi < 25) return { label: "طبيعي", cls: "text-[#10B981] bg-[#10B981]/10" };
  if (bmi < 30) return { label: "زيادة وزن", cls: "text-[#F59E0B] bg-[#F59E0B]/10" };
  return { label: "سمنة", cls: "text-[#EF4444] bg-[#EF4444]/10" };
}

export default function TrainerPortalPage() {
  const schools = useQuery(api.schools.list) || [];
  const allStudents = useQuery(api.students.list) || [];
  const updateMeasurements = useMutation(api.students.updateMeasurements);

  const [selectedSchool, setSelectedSchool] = useState("");
  const [editStudent, setEditStudent] = useState(null);
  const [mForm, setMForm] = useState({ height: "", weight: "", pushUpScore: "", sitUpScore: "", flexibilityScore: "", agilityScore: "", enduranceScore: "" });
  const [saving, setSaving] = useState(false);

  const schoolStudents = useMemo(() => {
    if (!selectedSchool) return [];
    return allStudents.filter(s => s.schoolId === selectedSchool);
  }, [allStudents, selectedSchool]);

  const school = schools.find(s => s._id === selectedSchool);
  const bmi = calcBMI(parseFloat(mForm.height), parseFloat(mForm.weight));
  const bmiInfo = bmi > 0 ? getBMICategory(bmi) : null;

  const openMeasurements = (student) => {
    setEditStudent(student);
    setMForm({
      height: student.height?.toString() || "",
      weight: student.weight?.toString() || "",
      pushUpScore: student.pushUpScore?.toString() || "",
      sitUpScore: student.sitUpScore?.toString() || "",
      flexibilityScore: student.flexibilityScore?.toString() || "",
      agilityScore: student.agilityScore?.toString() || "",
      enduranceScore: student.enduranceScore?.toString() || "",
    });
  };

  const handleSave = async () => {
    if (!mForm.height || !mForm.weight) {
      toast.error("أدخل الطول والوزن على الأقل");
      return;
    }
    setSaving(true);
    try {
      const h = parseFloat(mForm.height);
      const w = parseFloat(mForm.weight);
      await updateMeasurements({
        id: editStudent._id,
        height: h,
        weight: w,
        bmi: parseFloat(calcBMI(h, w).toFixed(2)),
        pushUpScore: mForm.pushUpScore ? parseFloat(mForm.pushUpScore) : undefined,
        sitUpScore: mForm.sitUpScore ? parseFloat(mForm.sitUpScore) : undefined,
        flexibilityScore: mForm.flexibilityScore ? parseFloat(mForm.flexibilityScore) : undefined,
        agilityScore: mForm.agilityScore ? parseFloat(mForm.agilityScore) : undefined,
        enduranceScore: mForm.enduranceScore ? parseFloat(mForm.enduranceScore) : undefined,
      });
      toast.success("تم حفظ القياسات والنتائج بنجاح");
      setEditStudent(null);
    } catch (err) {
      toast.error(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const hasMeasurements = (st) => st.height && st.weight;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto" data-testid="trainer-portal-page">
      <Toaster position="top-center" dir="rtl" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-['Alexandria']">إدخال القياسات والاختبارات</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">اختر المدرسة ثم أدخل القياسات ونتائج الاختبارات لكل طالب</p>
      </div>

      {/* School Selector */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <Label className="text-[#4B5563] text-base font-semibold">اختر المدرسة</Label>
          <Select value={selectedSchool} onValueChange={setSelectedSchool} dir="rtl">
            <SelectTrigger className="mt-2 h-12 text-base" data-testid="trainer-school-select">
              <SelectValue placeholder="اختر المدرسة لعرض طلابها" />
            </SelectTrigger>
            <SelectContent>
              {schools.filter(s => s.isActive).map(s => {
                const count = allStudents.filter(st => st.schoolId === s._id).length;
                return <SelectItem key={s._id} value={s._id}>{s.name} ({count} طالب)</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Students List */}
      {selectedSchool && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1A1A1A] font-['Alexandria']">
              طلاب {school?.name} ({schoolStudents.length})
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" />مكتمل</span>
              <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="w-3 h-3" />بانتظار القياسات</span>
            </div>
          </div>

          {schoolStudents.length === 0 ? (
            <Card className="border-[#E5E1D8]">
              <CardContent className="p-8 text-center">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 text-[#E5E1D8]" />
                <p className="text-[#9CA3AF]">لا يوجد طلاب مسجلين في هذه المدرسة</p>
              </CardContent>
            </Card>
          ) : (
            schoolStudents.map(st => {
              const done = hasMeasurements(st);
              return (
                <Card key={st._id} className={`border transition-all ${done ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"}`} data-testid={`trainer-student-${st._id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-emerald-100" : "bg-amber-100"}`}>
                          {done ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{st.fullName}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-[#9CA3AF] mt-0.5">
                            <span>{st.grade}</span>
                            <span dir="ltr">{st.birthYear}</span>
                            <span dir="ltr">{st.personalId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {done && (
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-white border border-[#E5E1D8]">BMI: {st.bmi?.toFixed(1)}</span>
                            {st.pushUpScore != null && <span className="px-2 py-1 rounded bg-white border border-[#E5E1D8] hidden sm:inline">ضغط: {st.pushUpScore}</span>}
                          </div>
                        )}
                        <Button onClick={() => openMeasurements(st)} data-testid={`edit-measurements-${st._id}`}
                          className={done ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#D4AF37] hover:bg-[#B5952F] text-white"}>
                          <Ruler className="w-4 h-4 ml-2" />{done ? "تعديل القياسات" : "إدخال القياسات"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Measurements Dialog */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Alexandria'] text-[#8A1538]">
              القياسات والاختبارات - {editStudent?.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Measurements */}
            <div>
              <h4 className="text-sm font-semibold text-[#4B5563] mb-3 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#8A1538]" />القياسات الجسمية
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#9CA3AF]">الطول (سم) *</Label>
                  <Input type="number" value={mForm.height} onChange={e => setMForm(p => ({ ...p, height: e.target.value }))} data-testid="m-height" className="mt-1 h-11" dir="ltr" placeholder="170" min="50" max="250" />
                </div>
                <div>
                  <Label className="text-xs text-[#9CA3AF]">الوزن (كغ) *</Label>
                  <Input type="number" value={mForm.weight} onChange={e => setMForm(p => ({ ...p, weight: e.target.value }))} data-testid="m-weight" className="mt-1 h-11" dir="ltr" placeholder="65" min="10" max="300" />
                </div>
              </div>
              {bmi > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-[#F5F3EC] flex items-center justify-between" data-testid="m-bmi">
                  <span className="text-sm text-[#4B5563]">BMI</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]" dir="ltr">{bmi.toFixed(1)}</span>
                    {bmiInfo && <span className={`text-xs px-2 py-0.5 rounded-full ${bmiInfo.cls}`}>{bmiInfo.label}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Tests */}
            <div>
              <h4 className="text-sm font-semibold text-[#4B5563] mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#D4AF37]" />نتائج الاختبارات البدنية
              </h4>
              <div className="space-y-3">
                {[
                  { key: "pushUpScore", label: "اختبار الضغط", unit: "عدد مرات", icon: Dumbbell, color: "#8A1538" },
                  { key: "sitUpScore", label: "اختبار البطن", unit: "عدد مرات", icon: Heart, color: "#D4AF37" },
                  { key: "flexibilityScore", label: "اختبار المرونة", unit: "سم", icon: Ruler, color: "#10B981" },
                  { key: "agilityScore", label: "اختبار الرشاقة", unit: "ثانية", icon: Zap, color: "#3B82F6" },
                  { key: "enduranceScore", label: "اختبار التحمل", unit: "دقيقة", icon: Timer, color: "#8B5CF6" },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <div key={t.key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + "10" }}>
                        <Icon className="w-4 h-4" style={{ color: t.color }} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-[#9CA3AF]">{t.label} ({t.unit})</Label>
                        <Input type="number" value={mForm[t.key]} onChange={e => setMForm(p => ({ ...p, [t.key]: e.target.value }))} data-testid={`m-${t.key}`} className="mt-0.5 h-10" dir="ltr" placeholder="0" step="0.1" min="0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving} data-testid="save-measurements-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">
              <Save className="w-4 h-4 ml-2" />{saving ? "جاري الحفظ..." : "حفظ القياسات"}
            </Button>
            <Button variant="outline" onClick={() => setEditStudent(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
