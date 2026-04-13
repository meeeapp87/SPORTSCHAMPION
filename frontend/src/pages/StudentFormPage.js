import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Plus, X, ArrowRight } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const NATIONALITIES = ["قطري", "سعودي", "إماراتي", "كويتي", "بحريني", "عماني", "مصري", "أردني", "سوري", "عراقي", "لبناني", "فلسطيني", "يمني", "سوداني", "تونسي", "جزائري", "مغربي", "أخرى"];

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const schools = useQuery(api.schools.list) || [];
  const allStudents = useQuery(api.students.list) || [];
  const existingStudent = useQuery(api.students.get, id ? { id } : "skip");
  const createStudent = useMutation(api.students.createBasic);
  const updateStudent = useMutation(api.students.update);

  const [form, setForm] = useState({
    schoolId: "", fullName: "", stage: "", grade: "", birthYear: "",
    personalId: "", nationality: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && existingStudent) {
      setForm({
        schoolId: existingStudent.schoolId || "",
        fullName: existingStudent.fullName || "",
        stage: existingStudent.stage || "",
        grade: existingStudent.grade || "",
        birthYear: existingStudent.birthYear?.toString() || "",
        personalId: existingStudent.personalId || "",
        nationality: existingStudent.nationality || "",
      });
    }
  }, [isEdit, existingStudent]);

  const selectedSchool = useMemo(() => schools.find(s => s._id === form.schoolId), [schools, form.schoolId]);
  const schoolStudentCount = useMemo(() => {
    if (!form.schoolId) return 0;
    return allStudents.filter(s => s.schoolId === form.schoolId && (!isEdit || s._id !== id)).length;
  }, [allStudents, form.schoolId, isEdit, id]);
  const maxStudents = selectedSchool?.maxStudents || 3;
  const isFull = schoolStudentCount >= maxStudents;

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSchoolChange = (schoolId) => {
    const school = schools.find(s => s._id === schoolId);
    setForm(prev => ({
      ...prev,
      schoolId,
      stage: school?.stage || "",
      grade: "",
      birthYear: "",
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.schoolId) e.schoolId = "اختر المدرسة";
    if (!form.fullName.trim()) e.fullName = "أدخل الاسم الكامل";
    if (!form.grade) e.grade = "اختر الصف";
    if (!form.birthYear) e.birthYear = "اختر سنة الميلاد";
    if (!form.personalId.trim()) e.personalId = "أدخل الرقم الشخصي";
    if (!form.nationality) e.nationality = "اختر الجنسية";
    if (isFull && !isEdit) e.schoolId = "المدرسة وصلت للحد الأقصى";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (addAnother = false) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        fullName: form.fullName.trim(),
        stage: form.stage,
        grade: form.grade,
        birthYear: parseInt(form.birthYear),
        personalId: form.personalId.trim(),
        nationality: form.nationality,
      };
      if (isEdit) {
        await updateStudent({ id, ...data });
        toast.success("تم تحديث بيانات الطالب بنجاح");
        navigate(`/students/${id}`);
      } else {
        await createStudent({ ...data, schoolId: form.schoolId, schoolName: selectedSchool?.name || "" });
        toast.success("تم تسجيل الطالب بنجاح");
        if (addAnother) {
          setForm(prev => ({ ...prev, fullName: "", birthYear: "", personalId: "" }));
        } else {
          navigate("/students");
        }
      }
    } catch (err) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl" data-testid="student-form-page">
      <Toaster position="top-center" dir="rtl" />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Alexandria']">{isEdit ? "تعديل بيانات الطالب" : "تسجيل طالب جديد"}</h1>
          <p className="text-sm text-[#9CA3AF]">{isEdit ? "تعديل البيانات الأساسية" : "أدخل بيانات الطالب الأساسية (القياسات والاختبارات من صفحة المدرب)"}</p>
        </div>
      </div>

      {/* School Section */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">بيانات المدرسة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-[#4B5563]">المدرسة *</Label>
              <Select value={form.schoolId} onValueChange={handleSchoolChange} disabled={isEdit} dir="rtl">
                <SelectTrigger data-testid="school-select" className={`mt-1 ${errors.schoolId ? "border-red-400" : ""}`}>
                  <SelectValue placeholder="اختر المدرسة" />
                </SelectTrigger>
                <SelectContent>
                  {schools.filter(s => s.isActive).map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.schoolId && <p className="text-red-500 text-xs mt-1">{errors.schoolId}</p>}
            </div>
            <div>
              <Label className="text-[#4B5563]">المرحلة</Label>
              <Input value={form.stage} readOnly className="mt-1 bg-[#F5F3EC]" data-testid="stage-input" />
            </div>
            <div>
              <Label className="text-[#4B5563]">الصف *</Label>
              <Select value={form.grade} onValueChange={v => updateField("grade", v)} dir="rtl">
                <SelectTrigger data-testid="grade-select" className={`mt-1 ${errors.grade ? "border-red-400" : ""}`}>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedSchool?.grades || []).map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
            </div>
          </div>
          {selectedSchool && (
            <div className={`mt-3 p-2 rounded-lg text-xs font-medium ${isFull ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`} data-testid="school-capacity">
              {isFull ? "المدرسة وصلت للحد الأقصى" : `متبقٍ ${maxStudents - schoolStudentCount} مقعد من ${maxStudents}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Section */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">البيانات الشخصية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-[#4B5563]">الاسم الكامل *</Label>
              <Input value={form.fullName} onChange={e => updateField("fullName", e.target.value)} data-testid="fullname-input" className={`mt-1 ${errors.fullName ? "border-red-400" : ""}`} placeholder="الاسم الرباعي" />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <Label className="text-[#4B5563]">الرقم الشخصي *</Label>
              <Input value={form.personalId} onChange={e => updateField("personalId", e.target.value)} data-testid="personalid-input" className={`mt-1 ${errors.personalId ? "border-red-400" : ""}`} dir="ltr" placeholder="الرقم الشخصي" />
              {errors.personalId && <p className="text-red-500 text-xs mt-1">{errors.personalId}</p>}
            </div>
            <div>
              <Label className="text-[#4B5563]">سنة الميلاد *</Label>
              <Select value={form.birthYear} onValueChange={v => updateField("birthYear", v)} dir="rtl">
                <SelectTrigger data-testid="birthyear-select" className={`mt-1 ${errors.birthYear ? "border-red-400" : ""}`}>
                  <SelectValue placeholder="اختر سنة الميلاد" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedSchool?.allowedBirthYears || []).map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.birthYear && <p className="text-red-500 text-xs mt-1">{errors.birthYear}</p>}
            </div>
            <div>
              <Label className="text-[#4B5563]">الجنسية *</Label>
              <Select value={form.nationality} onValueChange={v => updateField("nationality", v)} dir="rtl">
                <SelectTrigger data-testid="nationality-select" className={`mt-1 ${errors.nationality ? "border-red-400" : ""}`}>
                  <SelectValue placeholder="اختر الجنسية" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-4 text-sm text-[#4B5563]" data-testid="measurements-note">
        <strong className="text-[#8A1538]">ملاحظة:</strong> القياسات الجسمية (الطول والوزن) ونتائج الاختبارات البدنية يتم إدخالها من صفحة <strong>"القياسات والاختبارات"</strong> بواسطة المدرب.
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-6">
        <Button onClick={() => handleSave(false)} disabled={saving} data-testid="save-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white h-11 px-8">
          <Save className="w-4 h-4 ml-2" />{saving ? "جاري الحفظ..." : "حفظ"}
        </Button>
        {!isEdit && (
          <Button onClick={() => handleSave(true)} disabled={saving} data-testid="save-and-new-btn" variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 h-11 px-8">
            <Plus className="w-4 h-4 ml-2" />حفظ وإضافة جديد
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate(-1)} data-testid="cancel-btn" className="h-11 px-8 text-[#9CA3AF]">
          <X className="w-4 h-4 ml-2" />إلغاء
        </Button>
      </div>
    </div>
  );
}
