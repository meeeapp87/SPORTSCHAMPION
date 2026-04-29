import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import schoolNamesData from "@/data/schools_names.json";
import { toast } from "sonner";
import { Save, Plus, X, ArrowRight } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

// إصلاح الأسماء المكسورة (mojibake) — UTF-8 اتقرأت غلط كـ cp1252
const CP1252 = {
  0x0160:0x8A,0x2020:0x86,0x201E:0x84,0x2026:0x85,0x02C6:0x88,0x201A:0x82,
  0x0161:0x9A,0x017E:0x9E,0x017D:0x8E,0x0152:0x8C,0x0153:0x9C,0x0192:0x83,
  0x02DC:0x98,0x2039:0x8B,0x203A:0x9B,0x2018:0x91,0x2019:0x92,0x201C:0x93,
  0x201D:0x94,0x2013:0x96,0x2014:0x97,0x2022:0x95,0x20AC:0x80,
};
function fixMojibake(text) {
  if (!text || (!text.includes('Ø') && !text.includes('Ù'))) return text;
  try {
    const bytes = [];
    for (const c of text) {
      const o = c.codePointAt(0);
      if (o <= 0xFF) bytes.push(o);
      else if (CP1252[o] !== undefined) bytes.push(CP1252[o]);
      else return text;
    }
    const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    return /[؀-ۿ]/.test(decoded) ? decoded.trim() : text;
  } catch { return text; }
}

// map: english prefix → arabic name (for display)
const ARABIC_BY_ENGLISH = Object.fromEntries(schoolNamesData.map(s => [s.english, s.arabic]));
const getArabicName = (convexName) => {
  if (!convexName) return "";
  const eng = convexName.split(' / ')[0]?.trim();
  const fromMap = ARABIC_BY_ENGLISH[eng];
  if (fromMap) return fromMap;
  const afterSlash = convexName.split(' / ')[1]?.trim();
  if (afterSlash) return fixMojibake(afterSlash);
  return fixMojibake(convexName);
};

const GENDER_MATCH = {
  "بنين": ["بنين"],
  "بنات": ["بنات"],
};

const NATIONALITIES = ["قطري", "سعودي", "إماراتي", "كويتي", "بحريني", "عماني", "مصري", "أردني", "سوري", "عراقي", "لبناني", "فلسطيني", "يمني", "سوداني", "تونسي", "جزائري", "مغربي", "أخرى"];

const STAGE_KEYWORDS = {
  "ابتدائي": { en: ["Primary"], ar: ["الابتدائية", "الابتدائي"] },
  "إعدادي":  { en: ["Preparatory"], ar: ["الاعدادية", "الإعدادية"] },
  "ثانوي":   { en: ["Secondary"], ar: ["الثانوية", "الثانوي"] },
};
const MODEL_KW = { en: ["Model"], ar: ["النموذجية"] };

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const schoolsQuery = useQuery(api.schools.list);
  const allStudentsQuery = useQuery(api.students.list);
  const settingsListQuery = useQuery(api.settings.getAll);
  const schools = useMemo(() => schoolsQuery || [], [schoolsQuery]);
  const allStudents = useMemo(() => allStudentsQuery || [], [allStudentsQuery]);
  const settingsList = useMemo(() => settingsListQuery || [], [settingsListQuery]);
  const existingStudent = useQuery(api.students.get, id ? { id } : "skip");
  const createStudent = useMutation(api.students.createBasic);
  const updateStudent = useMutation(api.students.update);

  const [form, setForm] = useState({
    schoolId: "", schoolName: "", gender: "", stage: "", grade: "",
    birthYear: "", fullName: "", personalId: "", nationality: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);

  useEffect(() => {
    if (isEdit && existingStudent) {
      setForm({
        schoolId: existingStudent.schoolId || "",
        schoolName: existingStudent.schoolName || "",
        gender: existingStudent.gender || "",
        fullName: existingStudent.fullName || "",
        stage: existingStudent.stage || "",
        grade: existingStudent.grade || "",
        birthYear: existingStudent.birthYear?.toString() || "",
        personalId: existingStudent.personalId || "",
        nationality: existingStudent.nationality || "",
      });
    }
  }, [isEdit, existingStudent]);

  const activeSchools = useMemo(() => schools.filter(s => s.isActive), [schools]);

  const gradeBirthYears = useMemo(() => {
    const setting = settingsList.find(s => s.key === "gradeBirthYears");
    return setting?.value || {};
  }, [settingsList]);

  // فلتر المدارس: من Convex لو فيه مدارس، وإلا من JSON كـ fallback
  const filteredSchools = useMemo(() => {
    if (activeSchools.length > 0) {
      // مدارس Convex: stage + gender صح
      return activeSchools
        .filter(s => {
          if (form.stage && s.stage !== form.stage) return false;
          if (form.gender) {
            const allowed = GENDER_MATCH[form.gender] || [form.gender];
            if (!allowed.includes(s.gender)) return false;
          }
          return true;
        })
        .map(s => ({
          _id: s._id,
          convexName: s.name,
          arabic: getArabicName(s.name),
          stage: s.stage,
          gender: s.gender,
        }))
        .sort((a, b) => a.arabic.localeCompare(b.arabic, "ar"));
    }
    // Fallback: JSON مباشرة لو Convex فاضي
    return schoolNamesData
      .filter(s => {
        if (form.gender) {
          const allowed = GENDER_MATCH[form.gender] || [form.gender];
          if (!allowed.includes(s.gender)) return false;
        }
        if (form.stage) {
          const kw = STAGE_KEYWORDS[form.stage];
          if (kw) {
            const matchStage = kw.en.some(k => s.english.includes(k)) || kw.ar.some(k => s.arabic.includes(k));
            if (!matchStage) return false;
          }
        }
        return true;
      })
      .map(s => ({ _id: s.english, convexName: s.label, arabic: s.arabic, stage: "", gender: s.gender }))
      .sort((a, b) => a.arabic.localeCompare(b.arabic, "ar"));
  }, [activeSchools, form.gender, form.stage]);

  // بعد اختيار المدرسة ابحث عنها في Convex
  const selectedSchool = useMemo(
    () => activeSchools.find(s => s._id === form.schoolId),
    [activeSchools, form.schoolId]
  );

  // سنوات الميلاد تُحدد من الصف المختار
  const allowedBirthYears = useMemo(() => {
    if (form.grade && gradeBirthYears[form.grade]?.length > 0)
      return gradeBirthYears[form.grade];
    if (selectedSchool?.allowedBirthYears?.length > 0)
      return selectedSchool.allowedBirthYears;
    return [];
  }, [form.grade, gradeBirthYears, selectedSchool]);

  const schoolStudentCount = useMemo(() => {
    if (!form.schoolId) return 0;
    return allStudents.filter(s => s.schoolId === form.schoolId && (!isEdit || s._id !== id)).length;
  }, [allStudents, form.schoolId, isEdit, id]);

  const maxStudents = selectedSchool?.maxStudents || Infinity;
  const isFull = form.schoolId && schoolStudentCount >= maxStudents;

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleGenderChange = (gender) => {
    setForm(prev => ({ ...prev, gender, stage: "", schoolId: "", schoolName: "", grade: "", birthYear: "" }));
    setErrors({});
  };

  const handleStageChange = (stage) => {
    setForm(prev => ({ ...prev, stage, schoolId: "", schoolName: "", grade: "", birthYear: "" }));
    setErrors({});
  };

  const handleSchoolSelect = (schoolId) => {
    const school = filteredSchools.find(s => s._id === schoolId);
    setForm(prev => ({
      ...prev,
      schoolId: school?._id || "",
      schoolName: school?.convexName || "",
      stage: school?.stage || prev.stage,
      grade: "",
      birthYear: "",
    }));
    setErrors(prev => ({ ...prev, schoolId: undefined }));
    setSchoolOpen(false);
  };

  const validate = () => {
    const e = {};
    if (!form.gender) e.gender = "اختر البنين أو البنات";
    if (!form.stage) e.stage = "اختر المرحلة";
    if (!form.schoolName) e.schoolId = "اختر المدرسة";
    if (!form.fullName.trim()) e.fullName = "أدخل الاسم الكامل";
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
        await createStudent({
          ...data,
          schoolId: form.schoolId || "manual",
          schoolName: form.schoolName,
        });
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
          <p className="text-sm text-[#9CA3AF]">{isEdit ? "تعديل البيانات الأساسية" : "أدخل بيانات الطالب الأساسية"}</p>
        </div>
      </div>

      {/* School Section */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">بيانات المدرسة</h3>

          {isEdit ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[#4B5563]">المدرسة</Label>
                <Input value={form.schoolName || form.schoolId} readOnly className="mt-1 bg-[#F5F3EC]" />
              </div>
              <div>
                <Label className="text-[#4B5563]">المرحلة</Label>
                <Input value={form.stage} readOnly className="mt-1 bg-[#F5F3EC]" />
              </div>
              <div>
                <Label className="text-[#4B5563]">الصف</Label>
                <Input value={form.grade} readOnly className="mt-1 bg-[#F5F3EC]" />
              </div>
            </div>
          ) : (
            <>
              {/* الخطوة 1: بنين / بنات */}
              <div className="mb-4">
                <Label className="text-[#4B5563] mb-2 block">النوع *</Label>
                <div className="flex gap-3">
                  {["بنين", "بنات"].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGenderChange(g)}
                      className={`flex-1 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                        form.gender === g
                          ? "border-[#8A1538] bg-[#8A1538] text-white"
                          : "border-[#E5E1D8] text-[#4B5563] hover:border-[#8A1538]/40"
                      }`}
                    >
                      {g === "بنين" ? "👦 بنين" : "👧 بنات"}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>

              {/* الخطوة 2: المرحلة */}
              <div className="mb-4">
                <Label className="text-[#4B5563] mb-2 block">المرحلة *</Label>
                <div className="flex gap-3">
                  {["ابتدائي", "إعدادي", "ثانوي"].map(s => (
                    <button
                      key={s}
                      type="button"
                      disabled={!form.gender}
                      onClick={() => handleStageChange(s)}
                      className={`flex-1 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                        !form.gender ? "opacity-40 cursor-not-allowed border-[#E5E1D8] text-[#9CA3AF]" :
                        form.stage === s
                          ? "border-[#D4AF37] bg-[#D4AF37] text-white"
                          : "border-[#E5E1D8] text-[#4B5563] hover:border-[#D4AF37]/60"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errors.stage && <p className="text-red-500 text-xs mt-1">{errors.stage}</p>}
              </div>

              {/* الخطوة 3: اسم المدرسة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-[#4B5563]">
                    المدرسة * 
                    {form.gender && form.stage && (
                      <span className="text-xs text-[#9CA3AF] mr-2">({filteredSchools.length} مدرسة)</span>
                    )}
                  </Label>
                  <Popover open={schoolOpen} onOpenChange={v => { if (form.stage) setSchoolOpen(v); }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        data-testid="school-select"
                        disabled={!form.stage}
                        className={`w-full mt-1 justify-end text-right font-normal h-auto min-h-[40px] whitespace-normal ${errors.schoolId ? "border-red-400" : ""}`}
                      >
                        {form.schoolName
                          ? <span className="text-right line-clamp-2 text-sm">{getArabicName(form.schoolName)}</span>
                          : <span className="text-muted-foreground text-sm">{!form.stage ? "اختر المرحلة أولاً" : "ابحث عن المدرسة..."}</span>
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[440px] p-0" align="start" side="bottom">
                      <Command filter={(value, search) => {
                        const item = filteredSchools.find(s => s._id === value);
                        if (!item) return 0;
                        const q = search.toLowerCase();
                        if (item.arabic.includes(q) || item.arabic.toLowerCase().includes(q)) return 1;
                        return 0;
                      }}>
                        <CommandInput placeholder="ابحث باسم المدرسة..." className="text-right" />
                        <CommandList className="max-h-64">
                          <CommandEmpty>لا توجد نتائج</CommandEmpty>
                          <CommandGroup>
                            {filteredSchools.map(s => (
                              <CommandItem
                                key={s._id}
                                value={s._id}
                                onSelect={() => handleSchoolSelect(s._id)}
                                className="text-sm text-right cursor-pointer"
                              >
                                {s.arabic}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.schoolId && <p className="text-red-500 text-xs mt-1">{errors.schoolId}</p>}
                </div>

                {/* الصف */}
                <div>
                  <Label className="text-[#4B5563]">الصف</Label>
                  {selectedSchool?.grades?.length > 0 ? (
                    <Select value={form.grade} onValueChange={v => { updateField("grade", v); updateField("birthYear", ""); }} dir="rtl">
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر الصف" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSchool.grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={form.grade}
                      onChange={e => updateField("grade", e.target.value)}
                      className="mt-1"
                      placeholder="الصف"
                    />
                  )}
                </div>
              </div>

              {selectedSchool && (
                <div className={`mt-3 p-2 rounded-lg text-xs font-medium ${isFull ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {isFull ? "المدرسة وصلت للحد الأقصى" : `متبقٍ ${maxStudents - schoolStudentCount} مقعد من ${maxStudents}`}
                </div>
              )}
            </>
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
              {allowedBirthYears.length > 0 ? (
                <Select value={form.birthYear} onValueChange={v => updateField("birthYear", v)} dir="rtl">
                  <SelectTrigger data-testid="birthyear-select" className={`mt-1 ${errors.birthYear ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="اختر سنة الميلاد" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedBirthYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.birthYear} onChange={e => updateField("birthYear", e.target.value)} className={`mt-1 ${errors.birthYear ? "border-red-400" : ""}`} placeholder="مثال: 2010" dir="ltr" data-testid="birthyear-input" />
              )}
              {errors.birthYear && <p className="text-red-500 text-xs mt-1">{errors.birthYear}</p>}
            </div>
            <div>
              <Label className="text-[#4B5563]">الجنسية *</Label>
              <Select value={form.nationality} onValueChange={v => updateField("nationality", v)} dir="rtl">
                <SelectTrigger data-testid="nationality-select" className={`mt-1 ${errors.nationality ? "border-red-400" : ""}`}>
                  <SelectValue placeholder="اختر الجنسية" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-4 text-sm text-[#4B5563]">
        <strong className="text-[#8A1538]">ملاحظة:</strong> القياسات الجسمية ونتائج الاختبارات البدنية يتم إدخالها من صفحة <strong>"القياسات والاختبارات"</strong> بواسطة المدرب.
      </div>

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
