import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Search, Eye, Pencil, Trash2, Download, UserPlus } from "lucide-react";
import * as XLSX from "xlsx";

export default function StudentListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const schoolsQuery = useQuery(api.schools.list);
  const studentsQuery = useQuery(api.students.list);
  const schools = useMemo(() => schoolsQuery || [], [schoolsQuery]);
  const students = useMemo(() => studentsQuery || [], [studentsQuery]);
  const removeStudent = useMutation(api.students.remove);

  const [search, setSearch] = useState("");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = useMemo(() => {
    let list = [...students];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.fullName.toLowerCase().includes(q) || s.schoolName.toLowerCase().includes(q) || s.personalId.includes(q));
    }
    if (filterSchool !== "all") list = list.filter(s => s.schoolId === filterSchool);
    if (filterStage !== "all") list = list.filter(s => s.stage === filterStage);
    return list;
  }, [students, search, filterSchool, filterStage]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const stages = [...new Set(schools.map(s => s.stage))];

  const handleDelete = async (id) => {
    try {
      await removeStudent({ id });
      toast.success("تم حذف الطالب بنجاح");
    } catch (e) { toast.error(e.message); }
  };

  const exportExcel = () => {
    const data = filtered.map(s => ({
      "الاسم": s.fullName, "المدرسة": s.schoolName, "المرحلة": s.stage,
      "الصف": s.grade, "سنة الميلاد": s.birthYear, "الرقم الشخصي": s.personalId,
      "الطول": s.height, "الوزن": s.weight, "BMI": s.bmi?.toFixed(1),
      "الضغط": s.pushUpScore || "", "البطن": s.sitUpScore || "",
      "المرونة": s.flexibilityScore || "", "الرشاقة": s.agilityScore || "", "التحمل": s.enduranceScore || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "students.xlsx");
  };

  const exportCSV = () => {
    const headers = ["الاسم","المدرسة","المرحلة","الصف","سنة الميلاد","الرقم الشخصي","الطول","الوزن","BMI"];
    const rows = filtered.map(s => [s.fullName,s.schoolName,s.stage,s.grade,s.birthYear,s.personalId,s.height,s.weight,s.bmi?.toFixed(1)]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "students.csv";
    link.click();
  };

  return (
    <div className="space-y-5 animate-fade-in" data-testid="student-list-page">
      <Toaster position="top-center" dir="rtl" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Alexandria']">قائمة الطلاب</h1>
          <p className="text-sm text-[#9CA3AF]">{filtered.length} طالب</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportExcel} variant="outline" size="sm" data-testid="export-excel-btn" className="border-[#E5E1D8] text-[#4B5563]">
            <Download className="w-3.5 h-3.5 ml-1" />Excel
          </Button>
          <Button onClick={exportCSV} variant="outline" size="sm" data-testid="export-csv-btn" className="border-[#E5E1D8] text-[#4B5563]">
            <Download className="w-3.5 h-3.5 ml-1" />CSV
          </Button>
          <Button onClick={() => navigate("/students/new")} size="sm" data-testid="add-student-list-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white">
            <UserPlus className="w-3.5 h-3.5 ml-1" />تسجيل طالب
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} data-testid="search-input" placeholder="بحث بالاسم أو المدرسة أو الرقم الشخصي..." className="pr-10" />
            </div>
            <Select value={filterSchool} onValueChange={v => { setFilterSchool(v); setPage(1); }} dir="rtl">
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-school">
                <SelectValue placeholder="كل المدارس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المدارس</SelectItem>
                {schools.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={v => { setFilterStage(v); setPage(1); }} dir="rtl">
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-stage">
                <SelectValue placeholder="كل المراحل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المراحل</SelectItem>
                {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="border-[#E5E1D8] overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FDFBF7] border-b border-[#E5E1D8]">
                  {["الاسم","المدرسة","المرحلة","الصف","سنة الميلاد","الرقم الشخصي","BMI","الإجراءات"].map(h => (
                    <th key={h} className="text-start p-3 font-semibold text-[#4B5563] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(st => (
                  <tr key={st._id} className="border-b border-[#E5E1D8]/50 hover:bg-[#F5F3EC] transition-colors" data-testid={`student-row-${st._id}`}>
                    <td className="p-3 font-medium text-[#1A1A1A]">{st.fullName}</td>
                    <td className="p-3 text-[#4B5563]">{st.schoolName}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{st.stage}</span></td>
                    <td className="p-3 text-[#4B5563]">{st.grade}</td>
                    <td className="p-3 text-[#4B5563]" dir="ltr">{st.birthYear}</td>
                    <td className="p-3 text-[#4B5563]" dir="ltr">{st.personalId}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        st.bmi < 18.5 ? "bg-amber-50 text-amber-700" : st.bmi < 25 ? "bg-emerald-50 text-emerald-700" : st.bmi < 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                      }`}>{st.bmi?.toFixed(1)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${st._id}`)} data-testid={`view-student-${st._id}`} className="h-8 w-8 text-[#4B5563] hover:text-[#8A1538]"><Eye className="w-3.5 h-3.5" /></Button>
                        {(user?.role === "admin" || user?.role === "school_user") && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${st._id}/edit`)} data-testid={`edit-student-${st._id}`} className="h-8 w-8 text-[#4B5563] hover:text-[#D4AF37]"><Pencil className="w-3.5 h-3.5" /></Button>
                            {user?.role === "admin" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`delete-student-${st._id}`} className="h-8 w-8 text-[#4B5563] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                    <AlertDialogDescription>هل أنت متأكد من حذف الطالب {st.fullName}؟</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-row-reverse gap-2">
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(st._id)} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="text-center p-8 text-[#9CA3AF]">لا توجد نتائج</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginated.map(st => (
          <Card key={st._id} className="border-[#E5E1D8]" data-testid={`student-card-${st._id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-[#1A1A1A]">{st.fullName}</p>
                  <p className="text-xs text-[#9CA3AF]">{st.schoolName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  st.bmi < 18.5 ? "bg-amber-50 text-amber-700" : st.bmi < 25 ? "bg-emerald-50 text-emerald-700" : st.bmi < 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                }`}>BMI: {st.bmi?.toFixed(1)}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#4B5563] mb-3">
                <span className="px-2 py-0.5 bg-[#8A1538]/5 text-[#8A1538] rounded-full">{st.stage}</span>
                <span>{st.grade}</span>
                <span dir="ltr">{st.personalId}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/students/${st._id}`)} data-testid={`view-card-${st._id}`} className="flex-1 text-xs">عرض</Button>
                {(user?.role === "admin" || user?.role === "school_user") && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/students/${st._id}/edit`)} className="text-xs">تعديل</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {paginated.length === 0 && <p className="text-center py-8 text-[#9CA3AF]">لا توجد نتائج</p>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="prev-page">السابق</Button>
          <span className="text-sm text-[#4B5563]">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="next-page">التالي</Button>
        </div>
      )}
    </div>
  );
}
