import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, CheckCircle, AlertTriangle, UserPlus, ArrowLeft } from "lucide-react";
import "@/App.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const schools = useQuery(api.schools.list) || [];
  const students = useQuery(api.students.list) || [];
  const seed = useMutation(api.seed.seedInitialData);

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
    { label: "المقاعد المتبقية", value: remainingSeats, icon: AlertTriangle, color: "bg-amber-500", lightColor: "bg-amber-50" },
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
          {schools.length === 0 ? (
            <p className="text-[#9CA3AF] text-center py-8">لا توجد مدارس مسجلة بعد</p>
          ) : (
            <div className="space-y-3">
              {schools.map(school => {
                const count = students.filter(st => st.schoolId === school._id).length;
                const max = school.maxStudents || 3;
                const isFull = count >= max;
                const pct = (count / max) * 100;
                return (
                  <div key={school._id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F5F3EC] transition-colors cursor-pointer" 
                    onClick={() => navigate(`/schools/${school._id}`)} data-testid={`school-row-${school._id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-[#1A1A1A] truncate">{school.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{school.stage}</span>
                      </div>
                      <div className="w-full h-2 bg-[#E5E1D8] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isFull ? "bg-emerald-500" : pct > 50 ? "bg-[#D4AF37]" : "bg-[#8A1538]"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${isFull ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {isFull ? "مكتمل" : `متبقٍ ${max - count}`}
                      </span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                      <td className="p-3 text-[#4B5563]">{st.schoolName}</td>
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
