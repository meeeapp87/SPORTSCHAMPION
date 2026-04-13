import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Pencil, Trash2, School, Settings, Database, UsersRound } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ROLE_LABELS = { admin: "مدير", school_user: "مدرسة", trainer: "مدرب", viewer: "عارض" };

const STAGES = ["ابتدائي", "إعدادي", "ثانوي"];
const GRADES_MAP = {
  "ابتدائي": ["الرابع", "الخامس", "السادس"],
  "إعدادي": ["الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي"],
  "ثانوي": ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
};

const defaultSchool = { name: "", stage: "", grades: [], allowedBirthYears: [], maxStudents: 3, isActive: true };

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

  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [editSchool, setEditSchool] = useState(null);
  const [schoolForm, setSchoolForm] = useState({ ...defaultSchool });
  const [birthYearInput, setBirthYearInput] = useState("");
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", name: "", role: "viewer", school_id: "", school_name: "" });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await axios.get(`${API}/admin/users`, { withCredentials: true });
      setUsers(data);
    } catch (e) { console.error(e); }
    setLoadingUsers(false);
  };

  const createUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.name) { toast.error("أدخل جميع البيانات المطلوبة"); return; }
    if (userForm.role === "school_user" && !userForm.school_id) { toast.error("اختر المدرسة للحساب"); return; }
    try {
      await axios.post(`${API}/admin/users`, {
        ...userForm,
        school_name: userForm.role === "school_user" ? schools.find(s => s._id === userForm.school_id)?.name : undefined,
      }, { withCredentials: true });
      toast.success("تم إنشاء الحساب بنجاح");
      setShowUserDialog(false);
      setUserForm({ email: "", password: "", name: "", role: "viewer", school_id: "", school_name: "" });
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.detail || "حدث خطأ"); }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API}/admin/users/${id}`, { withCredentials: true });
      toast.success("تم حذف الحساب");
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.detail || "حدث خطأ"); }
  };

  if (user?.role !== "admin") {
    return <div className="text-center py-20 text-[#9CA3AF]">ليس لديك صلاحية الوصول لهذه الصفحة</div>;
  }

  const getSetting = (key) => settings.find(s => s.key === key)?.value;

  const openSchoolDialog = (school = null) => {
    if (school) {
      setEditSchool(school);
      setSchoolForm({
        name: school.name, stage: school.stage, grades: school.grades || [],
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
    setSchoolForm(prev => ({ ...prev, stage, grades: GRADES_MAP[stage] || [] }));
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

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-page">
      <Toaster position="top-center" dir="rtl" />
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Alexandria']">لوحة الإدارة</h1>
        <p className="text-sm text-[#9CA3AF]">إدارة المدارس والإعدادات</p>
      </div>

      <Tabs defaultValue="schools" dir="rtl" onValueChange={v => v === "users" && fetchUsers()}>
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
        </TabsList>

        <TabsContent value="schools" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openSchoolDialog()} data-testid="add-school-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">
              <Plus className="w-4 h-4 ml-2" />إضافة مدرسة
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
                          <h4 className="font-semibold text-[#1A1A1A]">{school.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{school.stage}</span>
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
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && !loadingUsers && <p className="text-center py-8 text-[#9CA3AF]">اضغط على التبويب لتحميل المستخدمين</p>}
            {loadingUsers && <p className="text-center py-8 text-[#9CA3AF]">جاري التحميل...</p>}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
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
      </Tabs>

      {/* School Dialog */}
      <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Alexandria']">{editSchool ? "تعديل المدرسة" : "إضافة مدرسة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم المدرسة *</Label>
              <Input value={schoolForm.name} onChange={e => setSchoolForm(p => ({ ...p, name: e.target.value }))} data-testid="school-name-input" className="mt-1" placeholder="مدرسة..." />
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
                    {schools.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
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
