import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import primaryStandards from "@/data/fitness_standards_primary.json";
import middleStandards from "@/data/fitness_standards_middle.json";
import secondaryStandards from "@/data/fitness_standards_secondary.json";
import schoolNamesData from "@/data/schools_names.json";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Pencil, Trash2, School, Settings, Database, UsersRound, ClipboardList, X, KeyRound, Eye, EyeOff } from "lucide-react";
const ROLE_LABELS = { admin: "مدير", school_user: "مدرسة", trainer: "مدرب", viewer: "عارض" };

const STAGES = ["ابتدائي", "إعدادي", "ثانوي"];
const GENDERS = ["بنين", "بنات"];
const GRADES_MAP = {
  "ابتدائي": ["الرابع", "الخامس", "السادس"],
  "إعدادي": ["الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي"],
  "ثانوي": ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
};

const defaultSchool = { name: "", stage: "", gender: "", grades: [], allowedBirthYears: [], maxStudents: 3, isActive: true };
const CP1252_MAP = {
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
      else if (CP1252_MAP[o] !== undefined) bytes.push(CP1252_MAP[o]);
      else return text;
    }
    const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    return /[؀-ۿ]/.test(decoded) ? decoded.trim() : text;
  } catch { return text; }
}
const SCHOOL_LABEL_MAP = Object.fromEntries(schoolNamesData.map(s => [s.english, s.arabic]));
const getSchoolDisplayName = (name) => {
  if (!name) return "";
  const eng = name.split(' / ')[0]?.trim();
  const fromMap = SCHOOL_LABEL_MAP[eng];
  if (fromMap) return fromMap;
  const afterSlash = name.split(' / ')[1]?.trim();
  if (afterSlash) return fixMojibake(afterSlash);
  return fixMojibake(name);
};

const ALL_STANDARDS = [primaryStandards, middleStandards, secondaryStandards];

function StandardsViewer() {
  const [activeStage, setActiveStage] = useState(0);
  const current = ALL_STANDARDS[activeStage];
  return (
    <Card className="border-[#E5E1D8]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#8A1538] font-['Alexandria']">{current.stage_ar}</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{current.description_ar}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">معتمد رسمياً</span>
            <div className="flex rounded-lg overflow-hidden border border-[#E5E1D8]">
              {ALL_STANDARDS.map((s, i) => (
                <button
                  key={s.stage}
                  onClick={() => setActiveStage(i)}
                  className={`px-4 py-1.5 text-xs font-semibold transition-colors ${activeStage === i ? "bg-[#8A1538] text-white" : "bg-white text-[#4B5563] hover:bg-[#F5F3EC]"}`}
                >{s.stage_ar.replace("المرحلة ", "")}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-5">
          {current.tests.map(test => (
            <StandardsTestCard key={test.key} test={test} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StandardsTestCard({ test }) {
  const [activeGender, setActiveGender] = useState("boys");
  const rows = test.mappings[activeGender] || [];
  const dirLabel = test.direction === "higher_is_better" ? "↑ كلما زاد أفضل" : "↓ كلما قل أفضل";

  return (
    <div className="rounded-lg border border-[#E5E1D8] overflow-hidden">
      <div className="flex items-center justify-between bg-[#8A1538]/5 px-4 py-3 border-b border-[#E5E1D8]">
        <div>
          <span className="font-semibold text-[#1A1A1A] text-sm">{test.name_ar}</span>
          <span className="text-xs text-[#9CA3AF] mr-2">{test.name_en}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">{dirLabel}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">{test.unit_ar}</span>
          <div className="flex rounded-lg overflow-hidden border border-[#E5E1D8]">
            <button
              onClick={() => setActiveGender("boys")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${activeGender === "boys" ? "bg-[#8A1538] text-white" : "bg-white text-[#4B5563] hover:bg-[#F5F3EC]"}`}
            >بنين</button>
            <button
              onClick={() => setActiveGender("girls")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${activeGender === "girls" ? "bg-[#8A1538] text-white" : "bg-white text-[#4B5563] hover:bg-[#F5F3EC]"}`}
            >بنات</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FDFBF7] border-b border-[#E5E1D8]">
              <th className="text-right px-4 py-2 text-xs font-semibold text-[#4B5563]">القيمة ({test.unit_ar})</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-[#4B5563]">الدرجة / 100</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-[#4B5563]">المستوى</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E1D8]">
            {rows.map((row, i) => {
              const level =
                row.score >= 90 ? { label: "ممتاز", cls: "text-emerald-600 bg-emerald-50" } :
                row.score >= 75 ? { label: "جيد جداً", cls: "text-blue-600 bg-blue-50" } :
                row.score >= 60 ? { label: "جيد", cls: "text-[#D4AF37] bg-[#D4AF37]/10" } :
                row.score >= 40 ? { label: "مقبول", cls: "text-orange-500 bg-orange-50" } :
                { label: "ضعيف", cls: "text-red-500 bg-red-50" };
              return (
                <tr key={i} className="hover:bg-[#FDFBF7] transition-colors">
                  <td className="px-4 py-2 font-mono font-medium text-[#1A1A1A]" dir="ltr">{row.value}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#E5E1D8] rounded-full h-1.5 max-w-[80px]">
                        <div className="h-1.5 rounded-full bg-[#8A1538]" style={{ width: `${row.score}%` }} />
                      </div>
                      <span className="font-semibold text-[#1A1A1A] w-8 text-right">{row.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${level.cls}`}>{level.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const schools = useQuery(api.schools.list) || [];
  const students = useQuery(api.students.list) || [];
  const settings = useQuery(api.settings.getAll) || [];
  const createSchool = useMutation(api.schools.create);
  const updateSchool = useMutation(api.schools.update);
  const removeSchool = useMutation(api.schools.remove);
  const setSetting = useMutation(api.settings.set);
  const seedData = useMutation(api.seed.seedInitialData);
  const seedAllSchools = useMutation(api.seed.seedAllSchools);
  const fixMaxStudents = useMutation(api.seed.fixMaxStudents);
  const fixSchoolNames = useMutation(api.seed.fixSchoolNames);
  const deleteAllSchools = useMutation(api.seed.deleteAllSchools);
  const getSetting = (key) => settings.find(s => s.key === key)?.value;

  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [editSchool, setEditSchool] = useState(null);
  const [schoolForm, setSchoolForm] = useState({ ...defaultSchool });
  const [birthYearInput, setBirthYearInput] = useState("");
  const [schoolNameOpen, setSchoolNameOpen] = useState(false);
  const [gradeYearInput, setGradeYearInput] = useState({});
  const gradeBirthYears = getSetting("gradeBirthYears") || {};
  const users = useQuery(api.auth.listUsers) || [];
  const createUserMutation = useMutation(api.auth.createUser);
  const deleteUserMutation = useMutation(api.auth.deleteUser);
  const changePasswordMutation = useMutation(api.auth.changePassword);

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", name: "", role: "viewer", school_id: "", school_name: "" });

  const [showChangePassDialog, setShowChangePassDialog] = useState(false);
  const [changePassTarget, setChangePassTarget] = useState(null); // { id, name }
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const createUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.name) { toast.error("أدخل جميع البيانات المطلوبة"); return; }
    if (userForm.role === "school_user" && !userForm.school_id) { toast.error("اختر المدرسة للحساب"); return; }
    try {
      await createUserMutation({
        email: userForm.email,
        password: userForm.password,
        name: userForm.name,
        role: userForm.role,
        schoolId: userForm.role === "school_user" ? userForm.school_id : undefined,
        schoolName: userForm.role === "school_user" ? schools.find(s => s._id === userForm.school_id)?.name : undefined,
      });
      toast.success("تم إنشاء الحساب بنجاح");
      setShowUserDialog(false);
      setUserForm({ email: "", password: "", name: "", role: "viewer", school_id: "", school_name: "" });
    } catch (e) { toast.error(e.message || "حدث خطأ"); }
  };

  const deleteUser = async (id) => {
    try {
      await deleteUserMutation({ userId: id });
      toast.success("تم حذف الحساب");
    } catch (e) { toast.error(e.message || "حدث خطأ"); }
  };

  const openChangePass = (u) => {
    setChangePassTarget(u);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPass(false);
    setShowConfirmPass(false);
    setShowChangePassDialog(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword) { toast.error("أدخل كلمة المرور الجديدة"); return; }
    if (newPassword.length < 6) { toast.error("كلمة المرور لازم تكون 6 أحرف على الأقل"); return; }
    if (newPassword !== confirmPassword) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setChangingPass(true);
    try {
      await changePasswordMutation({ userId: changePassTarget.id, newPassword });
      toast.success(`تم تغيير كلمة مرور ${changePassTarget.name} بنجاح`);
      setShowChangePassDialog(false);
    } catch (e) { toast.error(e.message || "حدث خطأ"); }
    finally { setChangingPass(false); }
  };

  const filteredSchoolNames = useMemo(() => {
    const stageKeywords = {
      "ابتدائي": { en: ["Primary"], ar: ["الابتدائية", "الابتدائي"] },
      "إعدادي":  { en: ["Preparatory"], ar: ["الاعدادية", "الإعدادية"] },
      "ثانوي":   { en: ["Secondary"], ar: ["الثانوية", "الثانوي"] },
    };
    const modelKeywords = { en: ["Model"], ar: ["النموذجية"] };

    return schoolNamesData.filter(s => {
      if (schoolForm.stage) {
        const kw = stageKeywords[schoolForm.stage];
        if (kw) {
          const matchStage = kw.en.some(k => s.english.includes(k)) || kw.ar.some(k => s.arabic.includes(k));
          const matchModel = modelKeywords.en.some(k => s.english.includes(k)) || modelKeywords.ar.some(k => s.arabic.includes(k));
          if (!matchStage && !matchModel) return false;
        }
      }
      if (schoolForm.gender) {
        if (s.gender !== schoolForm.gender) return false;
      }
      return true;
    });
  }, [schoolForm.stage, schoolForm.gender]);

  if (user?.role !== "admin") {
    return <div className="text-center py-20 text-[#9CA3AF]">ليس لديك صلاحية الوصول لهذه الصفحة</div>;
  }

  const openSchoolDialog = (school = null) => {
    if (school) {
      setEditSchool(school);
      setSchoolForm({
        name: school.name, stage: school.stage, gender: school.gender || "",
        grades: school.grades || [],
        allowedBirthYears: school.allowedBirthYears || [], maxStudents: school.maxStudents || 3, isActive: school.isActive ?? true,
      });
    } else {
      setEditSchool(null);
      setSchoolForm({ ...defaultSchool });
    }
    setBirthYearInput("");
    setShowSchoolDialog(true);
  };

  const handleStageChange = (stage) => {
    const grades = GRADES_MAP[stage] || [];
    // اجمع سنوات الميلاد من كل صف في المرحلة
    const years = [...new Set(grades.flatMap(g => gradeBirthYears[g] || []))].sort();
    setSchoolForm(prev => ({ ...prev, stage, grades, allowedBirthYears: years, name: "" }));
  };

  const addBirthYear = () => {
    const year = parseInt(birthYearInput);
    if (year && !schoolForm.allowedBirthYears.includes(year)) {
      setSchoolForm(prev => ({ ...prev, allowedBirthYears: [...prev.allowedBirthYears, year].sort() }));
      setBirthYearInput("");
    }
  };

  const removeBirthYear = (year) => {
    setSchoolForm(prev => ({ ...prev, allowedBirthYears: prev.allowedBirthYears.filter(y => y !== year) }));
  };

  const saveSchool = async () => {
    if (!schoolForm.name || !schoolForm.stage) { toast.error("أدخل اسم المدرسة والمرحلة"); return; }
    try {
      if (editSchool) {
        await updateSchool({ id: editSchool._id, ...schoolForm });
        toast.success("تم تحديث المدرسة");
      } else {
        await createSchool(schoolForm);
        toast.success("تم إضافة المدرسة");
      }
      setShowSchoolDialog(false);
    } catch (e) { toast.error(e.message); }
  };

  const deleteSchool = async (id) => {
    try {
      await removeSchool({ id });
      toast.success("تم حذف المدرسة");
    } catch (e) { toast.error(e.message); }
  };

  const handleSeed = async () => {
    try {
      const r = await seedData();
      toast.success(r?.status === "seeded" ? "تم تهيئة البيانات" : "البيانات موجودة مسبقاً");
    } catch (e) { toast.error(e.message); }
  };

  const handleImportAllSchools = async () => {
    const STAGE_MAP = {
      Primary: "ابتدائي", Preparatory: "إعدادي", Secondary: "ثانوي", Model: "ابتدائي",
    };
    const GRADES = {
      "ابتدائي": ["الرابع", "الخامس", "السادس"],
      "إعدادي":  ["الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي"],
      "ثانوي":   ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
    };
    const prepared = schoolNamesData.map(s => {
      let stage = "ابتدائي";
      for (const [kw, st] of Object.entries(STAGE_MAP)) {
        if (s.english.includes(kw)) { stage = st; break; }
      }
      return {
        name: s.arabic,   // الاسم العربي فقط - بدل s.label المكسور
        english: s.english,
        arabic: s.arabic,
        stage,
        gender: s.gender || "بنين",
        grades: GRADES[stage] || [],
      };
    });
    try {
      // أرسل على دفعات لتجنب timeout
      const BATCH = 50;
      let totalAdded = 0;
      for (let i = 0; i < prepared.length; i += BATCH) {
        const r = await seedAllSchools({ schools: prepared.slice(i, i + BATCH) });
        totalAdded += r.added;
      }
      toast.success(`تم استيراد ${totalAdded} مدرسة جديدة من أصل ${prepared.length}`);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-page">
      <Toaster position="top-center" dir="rtl" />
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Alexandria']">لوحة الإدارة</h1>
        <p className="text-sm text-[#9CA3AF]">إدارة المدارس والإعدادات</p>
      </div>

      <Tabs defaultValue="schools" dir="rtl">
        <TabsList className="bg-[#F5F3EC]">
          <TabsTrigger value="schools" data-testid="tab-schools" className="data-[state=active]:bg-[#8A1538] data-[state=active]:text-white gap-2">
            <School className="w-4 h-4" />المدارس
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users" className="data-[state=active]:bg-[#8A1538] data-[state=active]:text-white gap-2">
            <UsersRound className="w-4 h-4" />المستخدمين
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings" className="data-[state=active]:bg-[#8A1538] data-[state=active]:text-white gap-2">
            <Settings className="w-4 h-4" />الإعدادات
          </TabsTrigger>
          <TabsTrigger value="standards" data-testid="tab-standards" className="data-[state=active]:bg-[#8A1538] data-[state=active]:text-white gap-2">
            <ClipboardList className="w-4 h-4" />معايير التقييم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schools" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openSchoolDialog()} data-testid="add-school-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">
              <Plus className="w-4 h-4 ml-2" />إضافة مدرسة
            </Button>
            <Button onClick={async () => {
              if (!window.confirm(`سيتم حذف ${schools.length} مدرسة. هل أنت متأكد؟`)) return;
              const r = await deleteAllSchools({});
              toast.success(`تم حذف ${r.deleted} مدرسة`);
            }} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
              <X className="w-4 h-4 ml-2" />حذف كل المدارس
            </Button>
            <Button onClick={handleImportAllSchools} variant="outline" className="border-[#8A1538] text-[#8A1538] hover:bg-[#8A1538]/5">
              <Database className="w-4 h-4 ml-2" />استيراد كل المدارس ({schoolNamesData.length})
            </Button>
            <Button onClick={async () => { const r = await fixMaxStudents({ maxStudents: 3 }); toast.success(`تم تصحيح ${r.fixed} مدرسة من أصل ${r.total}`); }} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Settings className="w-4 h-4 ml-2" />تصحيح المقاعد (3 لكل مدرسة)
            </Button>
            <Button onClick={async () => {
              const payload = schoolNamesData.map(s => ({ english: s.english, arabic: s.arabic }));
              const r = await fixSchoolNames({ schools: payload });
              toast.success(`تم تصحيح أسماء ${r.fixed} مدرسة من أصل ${r.total}`);
            }} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Settings className="w-4 h-4 ml-2" />تصحيح أسماء المدارس
            </Button>
            {schools.length === 0 && (
              <Button onClick={handleSeed} variant="outline" data-testid="seed-btn" className="border-[#D4AF37] text-[#D4AF37]">
                <Database className="w-4 h-4 ml-2" />تهيئة بيانات تجريبية
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            {schools.map(school => {
              const count = students.filter(s => s.schoolId === school._id).length;
              const max = school.maxStudents || 3;
              return (
                <Card key={school._id} className="border-[#E5E1D8]" data-testid={`admin-school-${school._id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-[#1A1A1A]">{getSchoolDisplayName(school.name)}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{school.stage}</span>
                          {school.gender && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{school.gender}</span>}
                          {!school.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">معطلة</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-[#9CA3AF]">
                          <span>الطلاب: {count}/{max}</span>
                          <span>الصفوف: {school.grades?.join(", ")}</span>
                          <span>السنوات: {school.allowedBirthYears?.join(", ")}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openSchoolDialog(school)} data-testid={`edit-school-${school._id}`} className="h-8 w-8 text-[#4B5563] hover:text-[#D4AF37]">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`delete-school-${school._id}`} className="h-8 w-8 text-[#4B5563] hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف المدرسة</AlertDialogTitle>
                              <AlertDialogDescription>سيتم حذف المدرسة وجميع الطلاب المسجلين فيها. هل أنت متأكد؟</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSchool(school._id)} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {schools.length === 0 && <p className="text-center py-8 text-[#9CA3AF]">لا توجد مدارس</p>}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <Button onClick={() => { setUserForm({ email: "", password: "", name: "", role: "viewer", school_id: "", school_name: "" }); setShowUserDialog(true); }} data-testid="add-user-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">
            <Plus className="w-4 h-4 ml-2" />إنشاء حساب جديد
          </Button>
          <div className="grid gap-3">
            {users.map(u => (
              <Card key={u.id} className="border-[#E5E1D8]" data-testid={`user-${u.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-[#1A1A1A]">{u.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-[#8A1538]/10 text-[#8A1538]" : u.role === "trainer" ? "bg-blue-50 text-blue-600" : u.role === "school_user" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF]" dir="ltr">{u.email}</p>
                      {u.school_name && <p className="text-xs text-[#D4AF37] mt-0.5">{u.school_name}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openChangePass(u)} className="h-8 w-8 text-[#4B5563] hover:text-[#D4AF37]" title="تغيير كلمة المرور">
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                      {u.role !== "admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#4B5563] hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>حذف الحساب</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف حساب {u.name}؟</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && <p className="text-center py-8 text-[#9CA3AF]">لا يوجد مستخدمين</p>}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          {/* Grade Birth Years Settings */}
          <Card className="border-[#E5E1D8]">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[#8A1538] font-['Alexandria']">سنة الميلاد لكل صف</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">حدد سنة الميلاد المسموح بها لكل صف دراسي. عند تسجيل الطالب تظهر السنة تلقائياً حسب الصف.</p>
              </div>
              {Object.entries(GRADES_MAP).map(([stage, grades]) => (
                <div key={stage} className="rounded-lg border border-[#E5E1D8] overflow-hidden">
                  <div className="bg-[#8A1538]/5 px-4 py-2 border-b border-[#E5E1D8]">
                    <span className="text-sm font-semibold text-[#8A1538]">{stage}</span>
                  </div>
                  <div className="divide-y divide-[#E5E1D8]">
                    {grades.map(grade => {
                      const years = gradeBirthYears[grade] || [];
                      return (
                        <div key={grade} className="flex items-center gap-3 px-4 py-3 bg-white">
                          <div className="w-36 shrink-0">
                            <span className="text-sm font-medium text-[#1A1A1A]">{grade}</span>
                          </div>
                          <div className="flex gap-2 flex-1">
                            <Input
                              type="number"
                              value={gradeYearInput[grade] || ""}
                              onChange={e => setGradeYearInput(p => ({ ...p, [grade]: e.target.value }))}
                              placeholder="سنة الميلاد"
                              dir="ltr"
                              className="w-32 text-center"
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const yr = parseInt(gradeYearInput[grade]);
                                  if (yr && !years.includes(yr)) {
                                    const updated = { ...gradeBirthYears, [grade]: [...years, yr].sort() };
                                    setSetting({ key: "gradeBirthYears", value: updated });
                                    setGradeYearInput(p => ({ ...p, [grade]: "" }));
                                  }
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="bg-[#D4AF37] hover:bg-[#B5952F] text-white px-3"
                              onClick={() => {
                                const yr = parseInt(gradeYearInput[grade]);
                                if (yr && !years.includes(yr)) {
                                  const updated = { ...gradeBirthYears, [grade]: [...years, yr].sort() };
                                  setSetting({ key: "gradeBirthYears", value: updated });
                                  setGradeYearInput(p => ({ ...p, [grade]: "" }));
                                }
                              }}
                            >إضافة</Button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {years.length === 0 ? (
                              <span className="text-xs text-[#9CA3AF]">—</span>
                            ) : years.map(y => (
                              <span
                                key={y}
                                dir="ltr"
                                className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors select-none"
                                onClick={() => {
                                  const updated = { ...gradeBirthYears, [grade]: years.filter(yr => yr !== y) };
                                  setSetting({ key: "gradeBirthYears", value: updated });
                                }}
                              >{y} ×</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#E5E1D8]">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-base font-semibold text-[#8A1538] font-['Alexandria']">إعدادات النظام</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">الحد الأقصى للطلاب لكل مدرسة</p>
                    <p className="text-xs text-[#9CA3AF]">الحالي: {getSetting("maxStudentsPerSchool") || 3}</p>
                  </div>
                  <Input type="number" defaultValue={getSetting("maxStudentsPerSchool") || 3} className="w-20 text-center" dir="ltr" data-testid="max-students-input"
                    onBlur={e => setSetting({ key: "maxStudentsPerSchool", value: parseInt(e.target.value) || 3 })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">منع تكرار سنة الميلاد</p>
                    <p className="text-xs text-[#9CA3AF]">سنة ميلاد واحدة لكل طالب في المدرسة</p>
                  </div>
                  <Switch checked={getSetting("enforceUniqueBirthYear") ?? true} data-testid="unique-birthyear-switch"
                    onCheckedChange={v => setSetting({ key: "enforceUniqueBirthYear", value: v })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Standards Tab */}
        <TabsContent value="standards" className="mt-4">
          <StandardsViewer />
        </TabsContent>

      </Tabs>

      {/* School Dialog */}
      <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Alexandria']">{editSchool ? "تعديل المدرسة" : "إضافة مدرسة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>النوع *</Label>
                <Select value={schoolForm.gender} onValueChange={v => setSchoolForm(p => ({ ...p, gender: v, name: "" }))} dir="rtl">
                  <SelectTrigger className="mt-1"><SelectValue placeholder="بنين / بنات" /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المرحلة *</Label>
                <Select value={schoolForm.stage} onValueChange={handleStageChange} dir="rtl">
                  <SelectTrigger className="mt-1" data-testid="school-stage-select"><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>اسم المدرسة *</Label>
              <Popover open={schoolNameOpen} onOpenChange={v => { if (schoolForm.stage || schoolForm.gender) setSchoolNameOpen(v); }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline" role="combobox" data-testid="school-name-input"
                    disabled={!schoolForm.stage && !schoolForm.gender}
                    className="w-full mt-1 justify-between text-right font-normal h-auto min-h-[40px] whitespace-normal"
                  >
                    {schoolForm.name || <span className="text-muted-foreground">{(!schoolForm.stage && !schoolForm.gender) ? "اختر النوع أو المرحلة أولاً" : "اختر أو ابحث عن المدرسة..."}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[460px] p-0" align="start">
                  <Command filter={(value, search) => {
                    const item = filteredSchoolNames.find(s => s.label === value);
                    if (!item) return 0;
                    const q = search.toLowerCase();
                    if (item.english.toLowerCase().includes(q) || item.arabic.includes(q)) return 1;
                    return 0;
                  }}>
                    <CommandInput placeholder="ابحث بالعربي أو الإنجليزي..." />
                    <CommandList className="max-h-60">
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup>
                        {filteredSchoolNames.map(s => (
                          <CommandItem
                            key={s.label}
                            value={s.label}
                            onSelect={() => {
                              setSchoolForm(p => ({ ...p, name: s.label }));
                              setSchoolNameOpen(false);
                            }}
                            className="text-sm"
                          >
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>الصفوف</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {schoolForm.grades.map(g => (
                  <span key={g} className="text-xs px-2 py-1 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{g}</span>
                ))}
              </div>
            </div>
            <div>
              <Label>سنوات الميلاد المسموح بها</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={birthYearInput} onChange={e => setBirthYearInput(e.target.value)} data-testid="birth-year-input" placeholder="مثال: 2010" dir="ltr" className="flex-1" 
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addBirthYear())} />
                <Button type="button" onClick={addBirthYear} size="sm" className="bg-[#D4AF37] hover:bg-[#B5952F] text-white">إضافة</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {schoolForm.allowedBirthYears.map(y => (
                  <span key={y} className="text-xs px-2 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] cursor-pointer hover:bg-red-50 hover:text-red-500" onClick={() => removeBirthYear(y)} dir="ltr">{y} ×</span>
                ))}
              </div>
            </div>
            <div>
              <Label>الحد الأقصى للطلاب</Label>
              <Input type="number" value={schoolForm.maxStudents} onChange={e => setSchoolForm(p => ({ ...p, maxStudents: parseInt(e.target.value) || 3 }))} data-testid="max-students-school-input" className="mt-1 w-24" dir="ltr" min={1} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={schoolForm.isActive} onCheckedChange={v => setSchoolForm(p => ({ ...p, isActive: v }))} data-testid="school-active-switch" />
              <Label>المدرسة نشطة</Label>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2 mt-4">
            <Button onClick={saveSchool} data-testid="save-school-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowSchoolDialog(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassDialog} onOpenChange={setShowChangePassDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-['Alexandria'] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#D4AF37]" />
              تغيير كلمة مرور
            </DialogTitle>
          </DialogHeader>
          {changePassTarget && (
            <div className="mb-2 p-3 rounded-lg bg-[#F5F3EC] text-sm text-[#4B5563]">
              المستخدم: <span className="font-semibold text-[#1A1A1A]">{changePassTarget.name}</span>
              <span className="text-xs text-[#9CA3AF] block mt-0.5" dir="ltr">{changePassTarget.email}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label>كلمة المرور الجديدة *</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  dir="ltr"
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="pl-10"
                />
                <button type="button" onClick={() => setShowNewPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]">
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>تأكيد كلمة المرور *</Label>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  dir="ltr"
                  placeholder="أعد كتابة كلمة المرور"
                  className="pl-10"
                  onKeyDown={e => e.key === "Enter" && handleChangePassword()}
                />
                <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]">
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">كلمتا المرور غير متطابقتين</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <p className="text-emerald-600 text-xs mt-1">✓ كلمتا المرور متطابقتان</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2 mt-4">
            <Button onClick={handleChangePassword} disabled={changingPass} className="bg-[#D4AF37] hover:bg-[#B5952F] text-white">
              <KeyRound className="w-4 h-4 ml-2" />{changingPass ? "جاري الحفظ..." : "تغيير كلمة المرور"}
            </Button>
            <Button variant="outline" onClick={() => setShowChangePassDialog(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Alexandria']">إنشاء حساب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم *</Label>
              <Input value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} data-testid="user-name-input" className="mt-1" placeholder="اسم المستخدم" />
            </div>
            <div>
              <Label>البريد الإلكتروني *</Label>
              <Input value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} data-testid="user-email-input" className="mt-1" dir="ltr" placeholder="email@example.com" type="email" />
            </div>
            <div>
              <Label>كلمة المرور *</Label>
              <Input value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} data-testid="user-password-input" className="mt-1" dir="ltr" type="password" placeholder="********" />
            </div>
            <div>
              <Label>الدور *</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm(p => ({ ...p, role: v }))} dir="rtl">
                <SelectTrigger className="mt-1" data-testid="user-role-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school_user">حساب مدرسة - تسجيل الطلاب فقط</SelectItem>
                  <SelectItem value="trainer">مدرب - إدخال القياسات والاختبارات</SelectItem>
                  <SelectItem value="viewer">عارض - عرض فقط</SelectItem>
                  <SelectItem value="admin">مدير - صلاحيات كاملة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {userForm.role === "school_user" && (
              <div>
                <Label>المدرسة المرتبطة *</Label>
                <Select value={userForm.school_id} onValueChange={v => setUserForm(p => ({ ...p, school_id: v }))} dir="rtl">
                  <SelectTrigger className="mt-1" data-testid="user-school-select"><SelectValue placeholder="اختر المدرسة" /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => <SelectItem key={s._id} value={s._id}>{getSchoolDisplayName(s.name)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row-reverse gap-2 mt-4">
            <Button onClick={createUser} data-testid="save-user-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">إنشاء الحساب</Button>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
