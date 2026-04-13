import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Save, Plus, X, Users, GraduationCap, UserCheck } from "lucide-react";

const NATIONALITIES = ["قطري", "سعودي", "إماراتي", "كويتي", "بحريني", "عماني", "مصري", "أردني", "سوري", "عراقي", "لبناني", "فلسطيني", "يمني", "سوداني", "تونسي", "جزائري", "مغربي", "أخرى"];

export default function SchoolPortalPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id;
  const school = useQuery(api.schools.get, schoolId ? { id: schoolId } : "skip");
  const schoolStudents = useQuery(api.students.getBySchool, schoolId ? { schoolId } : "skip") || [];
  const createStudent = useMutation(api.students.createBasic);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", grade: "", birthYear: "", personalId: "", nationality: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const maxStudents = school?.maxStudents || 3;
  const isFull = schoolStudents.length >= maxStudents;
  const remaining = Math.max(0, maxStudents - schoolStudents.length);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "أدخل الاسم الكامل";
    if (!form.grade) e.grade = "اختر الصف";
    if (!form.birthYear) e.birthYear = "اختر سنة الميلاد";
    if (!form.personalId.trim()) e.personalId = "أدخل الرقم الشخصي";
    if (!form.nationality) e.nationality = "اختر الجنسية";
    if (isFull) e.general = "المدرسة وصلت للحد الأقصى";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (addAnother = false) => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createStudent({
        schoolId,
        schoolName: school?.name || "",
        fullName: form.fullName.trim(),
        stage: school?.stage || "",
        grade: form.grade,
        birthYear: parseInt(form.birthYear),
        personalId: form.personalId.trim(),
        nationality: form.nationality,
      });
      toast.success("تم تسجيل الطالب بنجاح");
      if (addAnother) {
        setForm({ fullName: "", grade: "", birthYear: "", personalId: "", nationality: "" });
      } else {
        setShowForm(false);
        setForm({ fullName: "", grade: "", birthYear: "", personalId: "", nationality: "" });
      }
    } catch (err) {
      toast.error(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  if (!schoolId || !school) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-[#E5E1D8]" />
          <p className="text-[#9CA3AF]">لم يتم ربط حسابك بمدرسة. تواصل مع المدير.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto" data-testid="school-portal-page">
      <Toaster position="top-center" dir="rtl" />

      {/* School Header */}
      <div className="bg-[#8A1538] rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Alexandria']">{school.name}</h1>
            <p className="text-white/70 text-sm">{school.stage} - تسجيل الطلاب</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{schoolStudents.length}</p>
            <p className="text-xs text-white/70">مسجلين</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{maxStudents}</p>
            <p className="text-xs text-white/70">الحد الأقصى</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${isFull ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
            <p className="text-2xl font-bold">{remaining}</p>
            <p className="text-xs text-white/70">متبقٍ</p>
          </div>
        </div>
      </div>

      {/* Add Student Button */}
      {!showForm && !isFull && (
        <Button onClick={() => setShowForm(true)} data-testid="open-form-btn" className="bg-[#D4AF37] hover:bg-[#B5952F] text-white w-full sm:w-auto h-12 text-base">
          <Plus className="w-5 h-5 ml-2" />تسجيل طالب جديد
        </Button>
      )}
      {isFull && !showForm && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <UserCheck className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
          <p className="text-emerald-700 font-medium">تم اكتمال التسجيل - المدرسة وصلت للحد الأقصى</p>
        </div>
      )}

      {/* Registration Form */}
      {showForm && (
        <Card className="border-[#E5E1D8] border-2 border-dashed" data-testid="registration-form">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#8A1538] font-['Alexandria']">بيانات الطالب الجديد</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-[#4B5563]">الاسم الكامل *</Label>
                <Input value={form.fullName} onChange={e => updateField("fullName", e.target.value)} data-testid="fullname-input" className={`mt-1 h-11 ${errors.fullName ? "border-red-400" : ""}`} placeholder="الاسم الرباعي" />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <Label className="text-[#4B5563]">الصف الدراسي *</Label>
                <Select value={form.grade} onValueChange={v => updateField("grade", v)} dir="rtl">
                  <SelectTrigger data-testid="grade-select" className={`mt-1 h-11 ${errors.grade ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {(school.grades || []).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
              </div>
              <div>
                <Label className="text-[#4B5563]">سنة الميلاد *</Label>
                <Select value={form.birthYear} onValueChange={v => updateField("birthYear", v)} dir="rtl">
                  <SelectTrigger data-testid="birthyear-select" className={`mt-1 h-11 ${errors.birthYear ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(school.allowedBirthYears || []).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.birthYear && <p className="text-red-500 text-xs mt-1">{errors.birthYear}</p>}
              </div>
              <div>
                <Label className="text-[#4B5563]">الرقم الشخصي *</Label>
                <Input value={form.personalId} onChange={e => updateField("personalId", e.target.value)} data-testid="personalid-input" className={`mt-1 h-11 ${errors.personalId ? "border-red-400" : ""}`} dir="ltr" placeholder="الرقم الشخصي" />
                {errors.personalId && <p className="text-red-500 text-xs mt-1">{errors.personalId}</p>}
              </div>
              <div>
                <Label className="text-[#4B5563]">الجنسية *</Label>
                <Select value={form.nationality} onValueChange={v => updateField("nationality", v)} dir="rtl">
                  <SelectTrigger data-testid="nationality-select" className={`mt-1 h-11 ${errors.nationality ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="اختر الجنسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
              </div>
            </div>
            {errors.general && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.general}</p>}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={() => handleSave(false)} disabled={saving} data-testid="save-student-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white h-11">
                <Save className="w-4 h-4 ml-2" />{saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} variant="outline" data-testid="save-add-btn" className="border-[#D4AF37] text-[#D4AF37] h-11">
                <Plus className="w-4 h-4 ml-2" />حفظ وإضافة آخر
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} className="h-11 text-[#9CA3AF]">
                <X className="w-4 h-4 ml-2" />إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#8A1538]" />
            <h3 className="text-base font-semibold text-[#1A1A1A] font-['Alexandria']">الطلاب المسجلين ({schoolStudents.length})</h3>
          </div>
          {schoolStudents.length === 0 ? (
            <p className="text-center py-8 text-[#9CA3AF]">لم يتم تسجيل أي طالب بعد</p>
          ) : (
            <div className="space-y-2">
              {schoolStudents.map((st, idx) => (
                <div key={st._id} className="flex items-center gap-3 p-3 rounded-lg bg-[#FDFBF7] border border-[#E5E1D8]" data-testid={`student-${st._id}`}>
                  <div className="w-8 h-8 rounded-full bg-[#8A1538]/10 flex items-center justify-center text-sm font-bold text-[#8A1538]">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A1A]">{st.fullName}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-[#9CA3AF] mt-0.5">
                      <span>{st.grade}</span>
                      <span dir="ltr">{st.birthYear}</span>
                      <span dir="ltr">{st.personalId}</span>
                      <span>{st.nationality}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
