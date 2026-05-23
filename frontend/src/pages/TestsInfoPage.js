import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dumbbell, Heart, Ruler, Zap, Timer, ChevronDown, ChevronUp, Target, Wrench, BookOpen, ClipboardCheck, ImageIcon } from "lucide-react";

const TESTS = [
  {
    id: 1,
    name: "انبطاح مائل",
    subtitle: "ثني الذراعين",
    category: "تمرينات القوة",
    icon: Dumbbell,
    color: "#8A1538",
    bgLight: "#8A153810",
    imgBg: "#FDF5F7",
    definition: "تعريف القوة: هي أقصى قوة يمكن لعضلة واحدة أو مجموعة من العضلات توليدها ضد مقاومة.",
    purpose: "قياس التحمل العضلي لعضلات الصدر.",
    tools: "جهاز قياس.",
    howTo: "من وضع الانبطاح المائل، يقوم الطالب بتبادل ثني الذراعين مع الحفاظ على استقامة الجسم.",
    modified: "يمكن تعديل الاختبار لغير القادرين على أداء التمرين من أصحاب الوزن الزائد أو ضعف العضلات عن طريق تغيير الوضع الابتدائي ليصبح: [انبطاح مائل بالارتكاز على الركبتين] ثم تبادل ثني الذراعين مع الحفاظ على استقامة الجسم.",
    scoring: "يؤدي الطالب التمرين لأقصى عدد ممكن ويتم احتساب الأداء الصحيح فقط عند ملامسة الصدر لجهاز القياس.",
  },
  {
    id: 2,
    name: "رقود قرفصاء",
    subtitle: "ثني الجذع أماماً",
    category: "تمرينات القوة",
    icon: Heart,
    color: "#D4AF37",
    bgLight: "#D4AF3710",
    imgBg: "#FDFBF4",
    definition: "تعريف تحمل القوة: هو قدرة العضلة على مقاومة شدة لأطول فترة ممكنة.",
    purpose: "قياس التحمل العضلي لعضلات البطن.",
    tools: "ساعة إيقاف.",
    howTo: "من وضع رقود القرفصاء، يتم تثبيت القدمين واليدين على جانبي الرأس أو أمام الصدر، ثم رفع الجذع أماماً والعودة إلى الوضع الابتدائي.",
    modified: null,
    scoring: "احتساب الأداء الصحيح لأقصى تكرار في زمن قدره دقيقة واحدة.",
  },
  {
    id: 3,
    name: "جلوس طويل",
    subtitle: "الذراعين أماماً",
    category: "قياس المرونة",
    icon: Ruler,
    color: "#10B981",
    bgLight: "#10B98110",
    imgBg: "#F4FDF8",
    definition: "تعريف المرونة: هي القدرة على تحريك المفاصل لأقصى مدى حركي ممكن.",
    purpose: "قياس مرونة عضلات الظهر والعضلات الخلفية للرجلين.",
    tools: "صندوق قياس المرونة من وضع الجلوس.",
    howTo: "من وضع الجلوس الطويل أمام صندوق القياس، يوضع الذراعين أماماً مواجهاً لأسفل، ثم محاولة الوصول لأقصى مسافة على مسطرة القياس، والثبات.",
    modified: null,
    scoring: "احتساب أفضل نتيجة من ثلاث محاولات.",
  },
  {
    id: 4,
    name: "الجري الارتدادي",
    subtitle: "10م × 4",
    category: "قياس الرشاقة",
    icon: Zap,
    color: "#3B82F6",
    bgLight: "#3B82F610",
    imgBg: "#F4F8FE",
    definition: "تعريف الرشاقة: هي القدرة على تغيير أوضاع الجسم على الأرض أو في الهواء.",
    purpose: "قياس مستوى الرشاقة.",
    tools: "ساعة إيقاف - أقماع/قوائم/علامات أرضية.",
    howTo: "وضع قمعين بينهما مسافة 10م، ثم محاولة الجري الارتدادي بينهما 4 مرات في أقل زمن ممكن.",
    modified: null,
    scoring: "احتساب زمن أداء الاختبار.",
    lowerBetter: true,
  },
  {
    id: 5,
    name: "جري مسافات متوسطة",
    subtitle: "قياس التحمل",
    category: "قياس التحمل",
    icon: Timer,
    color: "#8B5CF6",
    bgLight: "#8B5CF610",
    imgBg: "#F8F4FE",
    definition: "تعريف التحمل: هو قدرة الجسم على الاستمرار في أداء نشاط بدني لأطول فترة ممكنة.",
    purpose: "قياس مستوى التحمل القلبي التنفسي.",
    tools: "ميدان/مضمار - ساعة إيقاف.",
    howTo: "يقوم الطالب بالجري لمسافة محددة في أقل وقت ممكن مع الحفاظ على الاستمرارية.",
    modified: null,
    scoring: "احتساب زمن إتمام المسافة المحددة.",
    lowerBetter: true,
  },
];

function TestImage({ testId, color, name }) {
  const allSettings = useQuery(api.settings.getAll) || [];
  const storageId = allSettings.find(s => s.key === `testImage_${testId}`)?.value || null;
  const convexUrl = useQuery(api.files.getStorageUrl, storageId ? { storageId } : "skip");
  const publicUrl = `/tests/test-${testId}.png`;
  const [useFallback, setUseFallback] = useState(false);
  const [imgError, setImgError] = useState(false);

  const src = convexUrl || (!imgError ? publicUrl : null);

  if (!src || imgError) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <ImageIcon className="w-10 h-10 mb-2" style={{ color: color + "50" }} />
        <span className="text-xs text-[#9CA3AF]">لم تُرفع صورة بعد</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 mix-blend-multiply"
      style={{ display: "block" }}
      onError={() => {
        if (src === publicUrl) setImgError(true);
      }}
    />
  );
}

function TestCard({ test, index }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = test.icon;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E1D8] overflow-hidden shadow-sm hover:shadow-md transition-shadow group">

      {/* Image Banner — full width at top */}
      <div 
        className="relative w-full overflow-hidden flex items-center justify-center" 
        style={{ backgroundColor: test.imgBg || (test.color + "08"), height: "220px" }}
      >
        {/* number badge */}
        <div className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base z-10 shadow" style={{ backgroundColor: test.color }}>
          {index + 1}
        </div>
        {/* category badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white shadow" style={{ backgroundColor: test.color }}>
            {test.category}
          </span>
        </div>
        <TestImage testId={test.id} color={test.color} name={test.name} />
      </div>

      {/* Header info — below image */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: test.color }}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1A1A1A] font-['Alexandria']">{test.name}</h3>
            <p className="text-sm font-medium" style={{ color: test.color }}>{test.subtitle}</p>
          </div>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: test.color + "10" }}>
            <Target className="w-4 h-4 mt-0.5 shrink-0" style={{ color: test.color }} />
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-medium">الغرض</p>
              <p className="text-xs text-[#1A1A1A] leading-relaxed">{test.purpose}</p>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: test.color + "10" }}>
            <Wrench className="w-4 h-4 mt-0.5 shrink-0" style={{ color: test.color }} />
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-medium">الأدوات</p>
              <p className="text-xs text-[#1A1A1A] leading-relaxed">{test.tools}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium border-t border-[#E5E1D8] hover:bg-[#FDFBF7] transition-colors"
        style={{ color: test.color }}
      >
        <span>{expanded ? "إخفاء التفاصيل" : "عرض التفاصيل الكاملة"}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#E5E1D8] pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: test.bgLight }}>
              <BookOpen className="w-4 h-4" style={{ color: test.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#4B5563] mb-1">التعريف</p>
              <p className="text-sm text-[#4B5563] leading-relaxed">{test.definition}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: test.bgLight }}>
              <Icon className="w-4 h-4" style={{ color: test.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#4B5563] mb-1">كيفية أداء الاختبار</p>
              <p className="text-sm text-[#4B5563] leading-relaxed">{test.howTo}</p>
            </div>
          </div>

          {test.modified && (
            <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-amber-600 text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">أداء الاختبار المعدّل</p>
                <p className="text-sm text-amber-700 leading-relaxed">{test.modified}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: test.bgLight }}>
              <ClipboardCheck className="w-4 h-4" style={{ color: test.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#4B5563] mb-1">التسجيل</p>
              <p className="text-sm text-[#4B5563] leading-relaxed">{test.scoring}</p>
              {test.lowerBetter && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  الزمن الأقل = الأفضل
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestsInfoPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto" data-testid="tests-info-page">

      {/* Hero Header */}
      <div className="bg-[#8A1538] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white/5 translate-x-1/4 translate-y-1/4" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">دليل الاختبارات</p>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Alexandria'] mb-2">منافسات اللياقة البدنية</h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-lg">
            تتضمن منافسات اللياقة البدنية <span className="text-[#D4AF37] font-bold">5 اختبارات تنافسية</span> تقيس جوانب مختلفة من اللياقة البدنية للطلاب.
          </p>
        </div>
      </div>

      {/* Overview — 5 tests summary */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {TESTS.map((test, i) => {
          const Icon = test.icon;
          return (
            <div key={test.id} className="flex flex-col items-center text-center p-3 rounded-xl border border-[#E5E1D8] bg-white hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: test.color }}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-[#1A1A1A] font-['Alexandria'] leading-tight">{test.name}</span>
              <span className="text-[9px] sm:text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">{test.subtitle}</span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-2" style={{ backgroundColor: test.color }}>
                {i + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#1A1A1A] font-['Alexandria'] flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-[#8A1538] inline-block"></span>
          تفاصيل الاختبارات
        </h2>
        {TESTS.map((test, i) => (
          <TestCard key={test.id} test={test} index={i} />
        ))}
      </div>
    </div>
  );
}
