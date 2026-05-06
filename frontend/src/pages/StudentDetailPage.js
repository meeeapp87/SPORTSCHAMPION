import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ArrowRight, Pencil, Trash2, Printer, Dumbbell, Ruler, Weight, Heart, Timer, Zap, IdCard, Camera, X } from "lucide-react";

function getBMIInfo(bmi) {
  if (bmi < 18.5) return { label: "نقص وزن", cls: "text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20" };
  if (bmi < 25) return { label: "طبيعي", cls: "text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20" };
  if (bmi < 30) return { label: "زيادة وزن", cls: "text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20" };
  return { label: "سمنة", cls: "text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20" };
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = useQuery(api.students.get, { id });
  const removeStudent = useMutation(api.students.remove);
  const idCardUrl = useQuery(api.files.getStorageUrl, student?.idCardStorageId ? { storageId: student.idCardStorageId } : "skip");
  const testPhotoUrl = useQuery(api.files.getStorageUrl, student?.testPhotoStorageId ? { storageId: student.testPhotoStorageId } : "skip");
  const clearIdCard = useMutation(api.students.clearIdCard);

  if (student === undefined) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-4 border-[#8A1538] border-t-transparent"></div></div>;
  }
  if (!student) {
    return <div className="text-center py-20 text-[#9CA3AF]">الطالب غير موجود</div>;
  }

  const bmiInfo = getBMIInfo(student.bmi);
  const tests = [
    { label: "اختبار الضغط", value: student.pushUpScore, unit: "مرة", icon: Dumbbell, color: "text-[#8A1538]" },
    { label: "اختبار البطن", value: student.sitUpScore, unit: "مرة", icon: Heart, color: "text-[#D4AF37]" },
    { label: "اختبار المرونة", value: student.flexibilityScore, unit: "سم", icon: Ruler, color: "text-emerald-600" },
    { label: "اختبار الرشاقة", value: student.agilityScore, unit: "ثانية", icon: Zap, color: "text-blue-600" },
    { label: "اختبار التحمل", value: student.enduranceScore, unit: "دقيقة", icon: Timer, color: "text-purple-600" },
  ];

  const handleDelete = async () => {
    try {
      await removeStudent({ callerId: user.id, id });
      toast.success("تم حذف الطالب");
      navigate("/students");
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl" data-testid="student-detail-page">
      <Toaster position="top-center" dir="rtl" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Alexandria']">{student.fullName}</h1>
            <p className="text-sm text-[#9CA3AF]">{student.schoolName} - {student.stage}</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={() => window.print()} data-testid="print-btn" className="border-[#E5E1D8]">
            <Printer className="w-4 h-4 ml-2" />طباعة
          </Button>
          {(user?.role === "admin" || user?.role === "school_user") && (
            <Button onClick={() => navigate(`/students/${id}/edit`)} data-testid="edit-btn" className="bg-[#D4AF37] hover:bg-[#B5952F] text-white">
              <Pencil className="w-4 h-4 ml-2" />تعديل
            </Button>
          )}
          {user?.role === "admin" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" data-testid="delete-btn" className="border-red-200 text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 ml-2" />حذف
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  <AlertDialogDescription>هل أنت متأكد من حذف {student.fullName}؟</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Personal Info */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">البيانات الشخصية</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "المدرسة", value: student.schoolName },
              { label: "المرحلة", value: student.stage },
              { label: "الصف", value: student.grade },
              { label: "سنة الميلاد", value: student.birthYear },
              { label: "الرقم الشخصي", value: student.personalId },
              { label: "الجنسية", value: student.nationality },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-[#9CA3AF] mb-1">{item.label}</p>
                <p className="text-sm font-medium text-[#1A1A1A]" data-testid={`detail-${item.label}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Measurements */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">القياسات</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-[#FDFBF7]">
              <Weight className="w-5 h-5 mx-auto mb-2 text-[#8A1538]" />
              <p className="text-xs text-[#9CA3AF]">الطول</p>
              <p className="text-lg font-bold text-[#1A1A1A]" data-testid="detail-height">{student.height} <span className="text-xs font-normal">سم</span></p>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#FDFBF7]">
              <Weight className="w-5 h-5 mx-auto mb-2 text-[#D4AF37]" />
              <p className="text-xs text-[#9CA3AF]">الوزن</p>
              <p className="text-lg font-bold text-[#1A1A1A]" data-testid="detail-weight">{student.weight} <span className="text-xs font-normal">كغ</span></p>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#FDFBF7]">
              <p className="text-xs text-[#9CA3AF] mb-1">BMI</p>
              <p className="text-lg font-bold text-[#1A1A1A]" data-testid="detail-bmi">{student.bmi?.toFixed(1)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${bmiInfo.cls}`}>{bmiInfo.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests */}
      <Card className="border-[#E5E1D8]">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-[#8A1538] mb-4 font-['Alexandria']">نتائج الاختبارات البدنية</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tests.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-center gap-3 p-3 rounded-lg bg-[#FDFBF7] border border-[#E5E1D8]" data-testid={`test-${t.label}`}>
                  <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-5 h-5 ${t.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">{t.label}</p>
                    <p className="text-base font-bold text-[#1A1A1A]">
                      {t.value != null ? <><span dir="ltr">{t.value}</span> <span className="text-xs font-normal text-[#9CA3AF]">{t.unit}</span></> : <span className="text-[#9CA3AF]">-</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      {(idCardUrl || testPhotoUrl) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {idCardUrl && (
            <Card className="border-[#E5E1D8]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-[#8A1538] font-['Alexandria'] flex items-center gap-2">
                    <IdCard className="w-4 h-4" />البطاقة الشخصية
                  </h3>
                  {(user?.role === "admin" || user?.role === "school_user") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        try {
                          await clearIdCard({ callerId: user.id, id });
                          toast.success("تم حذف البطاقة");
                        } catch (e) { toast.error(e.message); }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <img src={idCardUrl} alt="البطاقة الشخصية" className="w-full rounded-lg border border-[#E5E1D8] object-contain max-h-48" data-testid="id-card-img" />
              </CardContent>
            </Card>
          )}
          {testPhotoUrl && (
            <Card className="border-[#E5E1D8]">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold text-[#8A1538] mb-3 font-['Alexandria'] flex items-center gap-2">
                  <Camera className="w-4 h-4" />صورة الاختبار
                </h3>
                <img src={testPhotoUrl} alt="صورة الاختبار" className="w-full rounded-lg border border-[#E5E1D8] object-cover max-h-48" data-testid="test-photo-img" />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
