import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, BookOpen, Eye } from "lucide-react";

export default function SchoolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const school = useQuery(api.schools.get, { id });
  const schoolStudents = useQuery(api.students.getBySchool, id ? { schoolId: id } : "skip") || [];

  if (school === undefined) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-4 border-[#8A1538] border-t-transparent"></div></div>;
  }
  if (!school) {
    return <div className="text-center py-20 text-[#9CA3AF]">المدرسة غير موجودة</div>;
  }

  const max = school.maxStudents || 3;
  const count = schoolStudents.length;
  const remaining = Math.max(0, max - count);
  const isFull = count >= max;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl" data-testid="school-detail-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Alexandria']">{school.name}</h1>
          <p className="text-sm text-[#9CA3AF]">{school.stage}</p>
        </div>
      </div>

      {/* School Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-[#8A1538]" />
            <p className="text-xs text-[#9CA3AF]">الطلاب</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{count} / {max}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-2 text-[#D4AF37]" />
            <p className="text-xs text-[#9CA3AF]">المرحلة</p>
            <p className="text-sm font-bold text-[#1A1A1A]">{school.stage}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#9CA3AF] mb-1">الحالة</p>
            <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${isFull ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {isFull ? "مكتمل" : `متبقٍ ${remaining}`}
            </span>
          </CardContent>
        </Card>
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-emerald-600" />
            <p className="text-xs text-[#9CA3AF]">المقاعد المتبقية</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{remaining}</p>
          </CardContent>
        </Card>
      </div>

      {/* School Details */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">تفاصيل المدرسة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#9CA3AF] mb-1">الصفوف المتاحة</p>
              <div className="flex flex-wrap gap-2">
                {school.grades?.map(g => (
                  <span key={g} className="text-xs px-2 py-1 rounded-full bg-[#8A1538]/5 text-[#8A1538]">{g}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] mb-1">سنوات الميلاد المسموح بها</p>
              <div className="flex flex-wrap gap-2">
                {school.allowedBirthYears?.map(y => (
                  <span key={y} className="text-xs px-2 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]" dir="ltr">{y}</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#8A1538] font-['Alexandria']">الطلاب المسجلين</h3>
            {!isFull && (
              <Button onClick={() => navigate("/students/new")} size="sm" data-testid="add-student-school-btn" className="bg-[#8A1538] hover:bg-[#6D102A] text-white text-xs">
                تسجيل طالب
              </Button>
            )}
          </div>
          {schoolStudents.length === 0 ? (
            <p className="text-center py-8 text-[#9CA3AF]">لا يوجد طلاب مسجلين</p>
          ) : (
            <div className="space-y-2">
              {schoolStudents.map(st => (
                <div key={st._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F3EC] transition-colors" data-testid={`school-student-${st._id}`}>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{st.fullName}</p>
                    <div className="flex gap-2 text-xs text-[#9CA3AF] mt-0.5">
                      <span>{st.grade}</span>
                      <span dir="ltr">{st.birthYear}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${
                        st.bmi < 18.5 ? "bg-amber-50 text-amber-600" : st.bmi < 25 ? "bg-emerald-50 text-emerald-600" : st.bmi < 30 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                      }`}>BMI: {st.bmi?.toFixed(1)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${st._id}`)} className="h-8 w-8">
                    <Eye className="w-4 h-4 text-[#4B5563]" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
