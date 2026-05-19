import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getSchoolDisplayName } from "@/lib/schoolUtils";
import { Trophy, Dumbbell, Heart, Ruler, Zap, Timer, ChevronRight, Medal, School, Calendar } from "lucide-react";
import { runRecordsPipeline, computeRecords } from "@/lib/recordsAnalysis";
import { getCurrentAcademicYear } from "@/lib/classification";
import results2026Data from "@/data/results2026.json";

/* ══════════════════════════════════════════════
   بيانات الفائزين — برنامج اللياقة البدنية والصحة قطر
   نتائج موسم 2025-2026 حسب الفئة العمرية (سنة الميلاد 2008 – 2016)
   ══════════════════════════════════════════════ */
export const HISTORICAL_WINNERS = {
  بنين: [
    { year: 2016, gold: { name: "خير أمين أبو أصبع",      school: "خليفة النموذجية" },                      silver: { name: "البراء عبد الرحمن المهدي",  school: "الخليج العربي النموذجية" },          bronze: { name: "محمد طاهر سمير",            school: "القدس النموذجية" } },
    { year: 2015, gold: { name: "جلال دارس معصار",         school: "خليفة النموذجية" },                      silver: { name: "خالد فيصل عبدالوهاب",       school: "ابن الهيثم الابتدائية للبنين" },    bronze: { name: "احمد المبشر عبده",          school: "احمد منصور الابتدائية للبنين" } },
    { year: 2014, gold: { name: "يوسف محمد سعيد",          school: "جابر بن حيان الابتدائية" },              silver: { name: "محمد عادل نظر",             school: "قطر الابتدائية للبنين" },           bronze: { name: "معين عثمان العبدلي",        school: "ابن الهيثم الابتدائية للبنين" } },
    { year: 2013, gold: { name: "حسان محمد الشرقاوى",      school: "عبدالرحمن بن جاسم الإعدادية للبنين" },  silver: { name: "محمد أحمد البعد الله",      school: "اليرموك الإعدادية" },               bronze: { name: "محمد كمال حسن",             school: "خالد بن احمد الإعدادية للبنين" } },
    { year: 2012, gold: { name: "الياس محمد حسن",           school: "المعهد الديني الإعدادي بنين" },          silver: { name: "حازم محمد الشرقاوى",        school: "عبدالرحمن بن جاسم الإعدادية للبنين" }, bronze: { name: "كرم احمد الزيتاوي",      school: "ابن خلدون الإعدادية للبنين" } },
    { year: 2011, gold: { name: "ريان بطرون",               school: "عبدالرحمن بن عوف الإعدادية للبنين" },   silver: { name: "قيس محمد صالح",             school: "خالد بن احمد الإعدادية للبنين" },  bronze: { name: "حافظ رياض حافظ",           school: "المعهد الديني الإعدادي بنين" } },
    { year: 2010, gold: { name: "عمر مختار قرني",           school: "احمد بن حنبل الثانوية للبنين" },        silver: { name: "ابوبكر عبدالعزيز دين",      school: "حمزة بن عبد المطلب الإعدادية" },   bronze: { name: "محمد سعيد مبخوت",          school: "مسعيد الإعدادية" } },
    { year: 2009, gold: { name: "عبدالله نايف تلايف",       school: "المعهد الديني الثانوي للبنين" },         silver: { name: "محمد طارق نعيم",            school: "ابن تيمية الثانوية" },              bronze: { name: "جهاد بدرالدين الاسمر",      school: "الدوحة الثانوية للبنين" } },
    { year: 2008, gold: { name: "دهياتوتروري",              school: "المعهد الديني الثانوي للبنين" },         silver: { name: "ياسر عرفي",                 school: "أحمد بن حنبل الثانوية للبنين" },   bronze: { name: "سلمان علي امين",           school: "الدوحة الثانوية للبنين" } },
  ],
  بنات: [
    { year: 2016, gold: { name: "ألاء أسامة",              school: "الشمال الابتدائية" },                    silver: { name: "سحاب راشد المري",           school: "السلام الابتدائية" },               bronze: { name: "عائشة محمود عبد الله",     school: "الغويرية المشتركة" } },
    { year: 2015, gold: { name: "المها جار الله",           school: "السلام الابتدائية" },                    silver: { name: "شيخة حمد آل ثاني",          school: "الغويرية المشتركة" },               bronze: { name: "عائشة سالم المري",          school: "الخوارزمي الابتدائية" } },
    { year: 2014, gold: { name: "جودي ناجي",               school: "العبيب الابتدائية للبنات" },             silver: { name: "ليلى حمد بامؤمن",           school: "الخوارزمي الابتدائية" },            bronze: { name: "مريم زيدان",               school: "بروق الابتدائية" } },
    { year: 2013, gold: { name: "لجين الاسعد العويني",      school: "الأقصى الإعدادية للبنات" },             silver: { name: "ترف كاظم الفهيدي",          school: "الوكرة الإعدادية للبنات" },         bronze: { name: "خديجة إيهاب محمد",         school: "سمية الابتدائية للبنات" } },
    { year: 2012, gold: { name: "الريم عبد الله",           school: "زينب الإعدادية" },                       silver: { name: "بيان أنور إبراهيم",         school: "الوكرة الإعدادية للبنات" },         bronze: { name: "فاطمة ناصر القحطاني",      school: "الظعاين الإعدادية للبنات" } },
    { year: 2011, gold: { name: "دعاء محمد",               school: "زينب الإعدادية" },                       silver: { name: "توبة مبين",                 school: "الوكرة الإعدادية للبنات" },         bronze: { name: "نوف عبد الرحمن أمانت",     school: "رفيدة بنت كعب الإعدادية" } },
    { year: 2010, gold: { name: "جنى حسام الصادي",          school: "آمنة بنت الأرقم الثانوية" },            silver: { name: "مريم المناعي",              school: "قطر التقنية الثانوية" },            bronze: { name: "ميرة خليل الشبول",         school: "قطر الثانوية" } },
    { year: 2009, gold: { name: "سارة بنت شمس",            school: "امنة بنت وهب الثانوية بنات" },          silver: { name: "صفية محمد",                 school: "الوكرة الثانوية" },                 bronze: { name: "مريم وحيد طرَش",           school: "الشيماء الثانوية" } },
    { year: 2008, gold: { name: "دانه محمد الفادني",        school: "رملة بنت ابي سفيان" },                  silver: { name: "نورة علي محسن",             school: "هند بنت ابي سفيان الثانوية" },     bronze: { name: "تبيان محمد الطيب",         school: "روضة بنت جاسم الثانوية" } },
  ],
};

/* ══════════════════════════════════════════════
   نتائج 2023-2024 — مشروع اللياقة البدنية والصحة
   المصدر: النتائج النهائية المعتمدة - النسخة الثانية
   ══════════════════════════════════════════════ */
export const WINNERS_2024 = {
  بنين: {
    "الضغط": {
      label: "اختبار الضغط", unit: "تكرار", lowerBetter: false, icon: "💪",
      stages: {
        "النموذجية": {
          gold:   { name: "بشير محمد سعيد",            school: "القادسية النموذجية للبنين",            score: "30" },
          silver: { name: "عبدالعزيز محمد السويدي",     school: "عبدالحميد الدايم النموذجية للبنين",    score: "29" },
          bronze: { name: "محمد حزام حمد المري",         school: "مدرسة الإخلاص النموذجية للبنين",      score: "28" },
        },
        "الابتدائية": {
          gold:   { name: "عبدالرحمن عمر الحسني",       school: "الخور النموذجية - ابتدائي",           score: "40" },
          silver: { name: "فهيم عبدالحكيم عبدالله",     school: "جابر بن حيان الابتدائية للبنين",      score: "37" },
          bronze: { name: "محمد محمود أحمد كرت",         school: "معاذ بن جبل الابتدائية للبنين",       score: "35" },
        },
        "الإعدادية": {
          gold:   { name: "برزان خالد المرفوع",          school: "أبي عبيدة الإعدادية للبنين",          score: "56" },
          silver: { name: "محمد رمضان أبو العزم",        school: "حمزة بن عبدالمطلب",                  score: "55" },
          bronze: { name: "ابراهيم محمد سعيد",           school: "عبدالرحمن بن جاسم الإعدادية",        score: "50" },
        },
        "الثانوية": {
          gold:   { name: "علي رضى روشن",               school: "الوكرة الثانوية للبنين",              score: "71" },
          silver: { name: "انس عمر يوسف",               school: "ابن تيمية الثانوية",                  score: "69" },
          bronze: { name: "إبراهيم علي رجب أبو كربل",   school: "خليفة الثانوية للبنين",               score: "68" },
        },
      },
    },
    "البطن": {
      label: "اختبار البطن", unit: "تكرار", lowerBetter: false, icon: "🏋️",
      stages: {
        "النموذجية": {
          gold:   { name: "عبدالعزيز ناصر المري",        school: "مدرسة الأخلاص النموذجية للبنين",      score: "45" },
          silver: { name: "محمد وجدي المغزوي",           school: "عبدالحميد الدايل النموذجية للبنين",   score: "44" },
          bronze: { name: "خالد أشرف شعبان",             school: "مدرسة القادسية النموذجية للبنين",     score: "39" },
        },
        "الابتدائية": {
          gold:   { name: "عبدالله سعيد عبدربه حيدره",   school: "مدرسة القدس النموذجية - بنين",       score: "62" },
          silver: { name: "عبدالهادي أحمد خليفة",        school: "مدرسة معيذر الابتدائية للبنين",       score: "53" },
          bronze: { name: "أنس طه السهو",                school: "مدرسة عبدالله بن رواحة الابتدائية",   score: "47" },
        },
        "الإعدادية": {
          gold:   { name: "حميد عمر حميد",               school: "مدرسة ابن خلدون الإعدادية للبنين",    score: "66" },
          silver: { name: "محمد عبدالتواب صدقي",          school: "مدرسة عبدالرحمن بن جاسم",            score: "59" },
          bronze: { name: "عبدالعزيز شفيع المري",         school: "مدرسة قطر للعلوم والتكنولوجيا",       score: "58" },
        },
        "الثانوية": {
          gold:   { name: "عبدالرحمن عبدالله جلال",       school: "مدرسة الوكرة الثانوية للبنين",        score: "68" },
          silver: { name: "أحمد هيثم كامل",              school: "مدرسة عمر بن الخطاب الثانوية",        score: "64" },
          bronze: { name: "الحسين علي الماحي",            school: "مدرسة خليفة الثانوية للبنين",         score: "63" },
        },
      },
    },
    "التحمل": {
      label: "اختبار التحمل", unit: "دقيقة:ثانية", lowerBetter: true, icon: "🏃",
      stages: {
        "النموذجية": {
          gold:   { name: "معاذ اسماعيل",                school: "القادسية النموذجية للبنين",            score: "3:11.59" },
          silver: { name: "عبد الله حسين",               school: "عبد الله بن زيد النموذجية للبنين",    score: "3:12.17" },
          bronze: { name: "علي سعود علي",                school: "سميسمة الابتدائية للبنين",            score: "3:12.72" },
        },
        "الابتدائية": {
          gold:   { name: "عمر أحمد فوزي",               school: "عبد الله بن تركي الابتدائية للبنين",  score: "2:51.63" },
          silver: { name: "عبادة علي فالح",              school: "مدرسة الخور الابتدائية للبنين",        score: "2:52.93" },
          bronze: { name: "جارالله صالح النابت",           school: "عبد الله بن رواحة الابتدائية",        score: "2:56.80" },
        },
        "الإعدادية": {
          gold:   { name: "زكريا شريف علوي",              school: "الرازي الاعدادية للبنين",             score: "3:56.50" },
          silver: { name: "عبد الله عماد",               school: "أبي عبيدة الاعدادية للبنين",           score: "4:17.43" },
          bronze: { name: "عادل رحمان",                  school: "الإمام الشافعي الاعدادية للبنين",      score: "4:52.63" },
        },
        "الثانوية": {
          gold:   { name: "عبد الله محمد عبد الله",       school: "عمر بن الخطاب الثانوية للبنين",       score: "4:01.29" },
          silver: { name: "علي الهادي علي جماع",          school: "خليفة الثانوية للبنين",               score: "4:03.50" },
          bronze: { name: "عبد العزيز الكعبي",            school: "جاسم بن حمد الثانوية",               score: "4:08.13" },
        },
      },
    },
    "المرونة": {
      label: "اختبار المرونة", unit: "سم", lowerBetter: false, icon: "📏",
      stages: {
        "النموذجية": {
          gold:   { name: "محمد عبد العزيز عثمان",        school: "عبد الحميد الديال النموذجية للبنين",  score: "40" },
          silver: { name: "عبد العزيز محمد عبد الحميد",   school: "عبد الله بن زيد ال محمود النموذجية", score: "37" },
          bronze: { name: "محمد عبد الرحمن وزاع",         school: "سميسمة الابتدائية للبنين",            score: "34" },
        },
        "الابتدائية": {
          gold:   { name: "حازم محمد الشرقاوي",           school: "جابر بن حيان الابتدائية للبنين",      score: "42.5" },
          silver: { name: "كريم حسيني أحمد",              school: "مدرسة معيذر الابتدائية للبنين",       score: "42" },
          bronze: { name: "مؤيد خميس محمد",               school: "القدس النموذجية للبنين",              score: "41" },
        },
        "الإعدادية": {
          gold:   { name: "محمد أمين طباني",              school: "الاحنف بن قيس الاعدادية للبنين",      score: "52" },
          silver: { name: "فيصل نضال سليم",               school: "ابن خلدون الاعدادية للبنين",          score: "51.5" },
          bronze: { name: "حمد محمد اليافعي",             school: "طلحة بن عبيد الله الاعدادية للبنين",  score: "49.5" },
        },
        "الثانوية": {
          gold:   { name: "مشعل جمال الدوسري",            school: "عمر بن الخطاب الثانوية للبنين",       score: "53" },
          silver: { name: "سلمان علي جبريل",              school: "الدوحة الثانوية للبنين",              score: "52" },
          bronze: { name: "سفيان عيد أبو بكر",            school: "عبد الله بن علي المسند الثانوية",     score: "49.5" },
        },
      },
    },
    "الرشاقة": {
      label: "اختبار الرشاقة", unit: "ثانية", lowerBetter: true, icon: "⚡",
      stages: {
        "النموذجية": {
          gold:   { name: "سلمان جار الله",               school: "الاخلاص النموذجية للبنين",            score: "9.34" },
          silver: { name: "يوسف سلمان",                   school: "القادسية النموذجية للبنين",           score: "9.72" },
          bronze: { name: "عبد العزيز محمد رحم الدين",    school: "عبد الله بن زيد ال محمود النموذجية", score: "9.87" },
        },
        "الابتدائية": {
          gold:   { name: "محمد سامح فتحي",               school: "القدس النموذجية للبنين",              score: "9.06" },
          silver: { name: "متعب سعيد المري",              school: "عبد الله بن تركي الابتدائية للبنين",  score: "9.41" },
          bronze: { name: "تميم سلطان الزعابي",           school: "معيذر الابتدائية للبنين",             score: "9.47" },
        },
        "الإعدادية": {
          gold:   { name: "محمد رائد محمد",               school: "طلحة بن عبيد الله الاعدادية للبنين",  score: "8.59" },
          silver: { name: "عمر اسامة",                    school: "حمزة بن عبد المطلب",                  score: "8.79" },
          bronze: { name: "سعيد مانع الشهواني",           school: "الاحنف الاعدادية للبنين",             score: "8.85" },
        },
        "الثانوية": {
          gold:   { name: "عبد الرحمة طلعة حسن",          school: "أحمد بن حنبل الثانوية للبنين",        score: "8.72" },
          silver: { name: "اياد عدنان احمد",              school: "احمد بن محمد ال ثاني الثانوية",       score: "8.82" },
          bronze: { name: "عبد الله علي الدوسري",          school: "ابن تيمية الثانوية للبنين",           score: "8.88" },
        },
      },
    },
  },
  بنات: {
    "الضغط": {
      label: "اختبار الضغط", unit: "تكرار", lowerBetter: false, icon: "💪",
      stages: {
        "الابتدائية": {
          gold:   { name: "روضة محسن المري",              school: "مدرسة بروق الابتدائية للبنات",        score: "55" },
          silver: { name: "المها جارالله المري",           school: "مدرسة العبيب الابتدائية للبنات",      score: "53" },
          bronze: { name: "بيلسان حيدر",                  school: "مدرسة سمية الابتدائية",              score: "50" },
        },
        "الإعدادية": {
          gold:   { name: "جمانة أحمد نبيل",              school: "الوكرة الإعدادية للبنات",             score: "55" },
          silver: { name: "شهد عرفات",                    school: "مدرسة حفصة الإعدادية للبنات",         score: "52" },
          bronze: { name: "الدانة فرحان القحطاني",         school: "مدرسة معيذر الإعدادية للبنات",        score: "51" },
        },
        "الثانوية": {
          gold:   { name: "هيا خميس الكبيسي",             school: "مدرسة الكعبان الثانوية للبنات",       score: "53" },
          silver: { name: "رزان غسان مرسي",               school: "مدرسة الإيمان الثانوية للبنات",       score: "39" },
          bronze: { name: "جميعة عثمان",                  school: "مدرسة رملة بنت أبي سفيان الثانوية",   score: "30" },
        },
      },
    },
    "البطن": {
      label: "اختبار البطن", unit: "تكرار", lowerBetter: false, icon: "🏋️",
      stages: {
        "الابتدائية": {
          gold:   { name: "رهف أحمد عمر",                 school: "مدرسة العبيب الابتدائية للبنات",      score: "42" },
          silver: { name: "ريم عمر اليزيدي",              school: "مدرسة بروق الابتدائية للبنات",        score: "40" },
          bronze: { name: "فريدة مصطفى محمد",             school: "مدرسة خديجة بنت خويلد",              score: "39" },
        },
        "الإعدادية": {
          gold:   { name: "شهد فرج المسلماني",            school: "البيان الإعدادية للبنات",             score: "53" },
          silver: { name: "فاطمة الأمير محمد",             school: "الوكرة الإعدادية للبنات",             score: "46" },
          bronze: { name: "منى محمد الخطبة",              school: "مدرسة حفصة الإعدادية للبنات",         score: "40" },
        },
        "الثانوية": {
          gold:   { name: "فاطمة محمد الجابرية",           school: "قطر التقنية الثانوية للبنات",         score: "43" },
          silver: { name: "وجد سمير الحمري",              school: "مدرسة الإيمان الثانوية للبنات",       score: "39" },
          bronze: { name: "سديل موسى العوض",              school: "مدرسة الكعبان الثانوية للبنات",       score: "31" },
        },
      },
    },
    "التحمل": {
      label: "اختبار التحمل", unit: "دقيقة:ثانية", lowerBetter: true, icon: "🏃",
      stages: {
        "الابتدائية": {
          gold:   { name: "سارة ناصر علي الكواري",         school: "خديجة الابتدائية للبنات",             score: "2:54.86" },
          silver: { name: "نوف عبد الرحمن أمانت",          school: "الشقب الابتدائية للبنات",             score: "2:57.96" },
          bronze: { name: "فرح عبد الله صلاح",             school: "نسيبة بنت كعب الابتدائية للبنات",    score: "2:59.36" },
        },
        "الإعدادية": {
          gold:   { name: "مايا مؤمن محمد",               school: "رقية الاعدادية للبنات",               score: "4:25.35" },
          silver: { name: "ايناس الجابري",                 school: "الوكرة الاعدادية للبنات",             score: "4:28.30" },
          bronze: { name: "هاجر داوود ناصر",               school: "الخور الاعدادية للبنات",              score: "4:34.09" },
        },
        "الثانوية": {
          gold:   { name: "سلمى ناصر حامد",               school: "امنة بنت وهب الثانوية للبنات",        score: "4:03.31" },
          silver: { name: "مريم جمعة البدر",               school: "الايمان الثانوية للبنات",             score: "5:22.59" },
          bronze: { name: "امنة غازي اليافعي",             school: "قطر التقنية الثانوية للبنات",         score: "5:39.37" },
        },
      },
    },
    "المرونة": {
      label: "اختبار المرونة", unit: "سم", lowerBetter: false, icon: "📏",
      stages: {
        "الابتدائية": {
          gold:   { name: "هناء دسوقي محمد",              school: "خديجة بنت خويلد",                     score: "47" },
          silver: { name: "نورة مبارك",                   school: "بروق الابتدائية للبنات",              score: "44" },
          bronze: { name: "رهف كريم محمود",               school: "نسيبة بنت كعب الابتدائية للبنات",    score: "43" },
        },
        "الإعدادية": {
          gold:   { name: "نور الهدى ياسر",               school: "رقية الاعدادية للبنات",               score: "50" },
          silver: { name: "اعياد صخر دفع الله",           school: "معيذر الاعدادية للبنات",              score: "49.5" },
          bronze: { name: "مهرة فهد مبارك",               school: "رفيدة بنت كعب الاعدادية للبنات",     score: "49" },
        },
        "الثانوية": {
          gold:   { name: "إيناس الجدوع",                 school: "الايمان الثانوية للبنات",             score: "50" },
          silver: { name: "روضة احمد محمد",               school: "رملة بنت ابي سفيان الثانوية للبنات",  score: "49" },
          bronze: { name: "فاطمة عبد الله الشحي",          school: "قطر التقنية الثانوية للبنات",         score: "47" },
        },
      },
    },
    "الرشاقة": {
      label: "اختبار الرشاقة", unit: "ثانية", lowerBetter: true, icon: "⚡",
      stages: {
        "الابتدائية": {
          gold:   { name: "ريفان حسين كلوب",              school: "سمية الابتدائية للبنات",              score: "11.01" },
          silver: { name: "شقحة علي المالكي",             school: "الشقب الابتدائية للبنات",             score: "11.05" },
          bronze: { name: "الجوري صالح العقيدي",           school: "بروق الابتدائية للبنات",              score: "11.22" },
        },
        "الإعدادية": {
          gold:   { name: "نادين حسين شعبان",             school: "حفصة الاعدادية للبنات",               score: "10.08" },
          silver: { name: "صفية محمد عبدو",               school: "الوكرة الاعدادية للبنات",             score: "10.47" },
          bronze: { name: "مريم ابراهيم العريمي",          school: "الخور الاعدادية للبنات",              score: "10.54" },
        },
        "الثانوية": {
          gold:   { name: "أسماء سليم علبي",              school: "الكعبان الثانوية للبنات",             score: "10.02" },
          silver: { name: "زينب حسين جاكري",              school: "قطر التقنية الثانوية للبنات",         score: "10.67" },
          bronze: { name: "سمية عارف صالح",               school: "رملة بنت ابي سفيان الثانوية للبنات",  score: "10.94" },
        },
      },
    },
  },
};

/* ══════════════════════════════════════════════
   نتائج 2024-2025 — النتائج النهائية لبرنامج اللياقة البدنية
   مرتبة حسب الفئة العمرية (سنة الميلاد) 2007 – 2015
   ══════════════════════════════════════════════ */
export const WINNERS_2025 = {
  بنين: [
    { age: "2015",
      gold:   { name: "خالد سعود عبد العزيز العلي",         school: "عبد الله الزبير النموذجية للبنين" },
      silver: { name: "عمر السيد عمر السيد",                school: "خليفة النموذجية للبنين" },
      bronze: { name: "مصطفى ابراهيم بكري",                 school: "القادسية النموذجية للبنين" } },
    { age: "2014",
      gold:   { name: "يوسف محمد سعيد",                    school: "جابر بن حيان الابتدائية للبنين" },
      silver: { name: "فضل عبد الرحمن درويش المنصور",        school: "احمد منصور الابتدائية للبنين" },
      bronze: { name: "علي جاسم زهري",                      school: "ابن الهيثم الابتدائية للبنين" } },
    { age: "2013",
      gold:   { name: "تميم سلطان الزعابي",                 school: "معيذر الابتدائية للبنين" },
      silver: { name: "حسان محمد نجاح الشرقاوي",            school: "جابر بن حيان الابتدائية للبنين" },
      bronze: { name: "ياسين أحمد عبد السيد",               school: "عبد الله بن تركي الابتدائية للبنين" } },
    { age: "2012",
      gold:   { name: "كرم احمد عبدالكريم الزيتاوي",        school: "ابن خلدون الاعدادية للبنين" },
      silver: { name: "حازم محمد الشرقاوي",                 school: "عبدالرحمن بن جاسم الإعدادية للبنين" },
      bronze: { name: "يعقوب يوسف صالح",                    school: "ابن الهيثم الابتدائية للبنين" } },
    { age: "2011",
      gold:   { name: "عبد الرحمن أحمد الناغي",             school: "حمزة بن عبد المطلب الإعدادية للبنين" },
      silver: { name: "احمد باسل مسمار",                    school: "ابن خلدون الاعدادية للبنين" },
      bronze: { name: "مازن محمد غنيم",                     school: "المعهد الديني الاعدادي الثانوي المستقل للبنين" } },
    { age: "2010",
      gold:   { name: "ابراهيم محمد سعيد",                  school: "عبدالرحمن بن جاسم الإعدادية للبنين" },
      silver: { name: "أبو بكر عبد العزيز",                  school: "حمزة بن عبد المطلب الإعدادية للبنين" },
      bronze: { name: "عبدالرحمن أحمد قطان",                school: "المعهد الديني الاعدادي الثانوي المستقل للبنين" } },
    { age: "2009",
      gold:   { name: "جهاد بدر الدين محمد الأسمر",          school: "الدوحة الثانوية للبنين" },
      silver: { name: "راكان محمد الجسيمان",                 school: "ابن تيمية الثانوية للبنين" },
      bronze: { name: "عبدالرحمن محمد هاشم",                school: "حسان بن ثابت الثانوية للبنين" } },
    { age: "2008",
      gold:   { name: "عمر احمد حسين عبد النبي",             school: "حسان بن ثابت الثانوية للبنين" },
      silver: { name: "أمين سالار محمد",                    school: "المعهد الديني الاعدادي الثانوي المستقل للبنين" },
      bronze: { name: "علي أحمد الطيري",                    school: "ابن تيمية الثانوية للبنين" } },
    { age: "2007",
      gold:   { name: "عبدالله محمد عبدالله عثمان خليفة",    school: "عمر بن الخطاب الثانوية للبنين" },
      silver: { name: "موسى كامارا",                        school: "المعهد الديني الاعدادي الثانوي المستقل للبنين" },
      bronze: { name: "محمد خير راوي كردي",                  school: "الدوحة الثانوية للبنين" } },
  ],
  بنات: [
    { age: "2015",
      gold:   { name: "وضحى شايع المفقاعي",                 school: "البروق الابتدائية للبنات" },
      silver: { name: "عائشة سالم المري",                   school: "الخوارزمي الابتدائية للبنات" },
      bronze: { name: "معجبة جابر سعد",                     school: "نسيبة بنت كعب الابتدائية للبنات" } },
    { age: "2014",
      gold:   { name: "لولوة علي الأحرق",                   school: "الخوارزمي الابتدائية للبنات" },
      silver: { name: "المها جار الله المري",                school: "العبيب الابتدائية للبنات" },
      bronze: { name: "شذى علي بسيوني",                     school: "ام سلمه الابتدائية للبنات" } },
    { age: "2013",
      gold:   { name: "جويل علاء تواف",                     school: "العبيب الابتدائية للبنات" },
      silver: { name: "عائشة علي سحابو",                    school: "الخوارزمي الابتدائية للبنات" },
      bronze: { name: "مفلحة عبد الله المري",                school: "ام سلمه الابتدائية للبنات" } },
    { age: "2012",
      gold:   { name: "عائشة يوسف الغفاري",                 school: "زينب الإعدادية للبنات" },
      silver: { name: "جنى حسام الصادي",                    school: "الظعاين الإعدادية للبنات" },
      bronze: { name: "شهد عرفات عبد الله",                  school: "حفصه الإعدادية للبنات" } },
    { age: "2011",
      gold:   { name: "زينات عاطف مصطفى",                   school: "الوجبة الإعدادية للبنات" },
      silver: { name: "لمار هيثم العريض",                   school: "زينب الإعدادية للبنات" },
      bronze: { name: "الريم خميس المريخي",                  school: "الخور الإعدادية للبنات" } },
    { age: "2010",
      gold:   { name: "الريم عبد الله النعيمي",              school: "زينب الإعدادية للبنات" },
      silver: { name: "فرح عبد الله صلاح",                  school: "رقية الإعدادية للبنات" },
      bronze: { name: "روزا عبيدان المري",                   school: "فاطمة الزهراء الإعدادية للبنات" } },
    { age: "2009",
      gold:   { name: "هبه محمد علي",                       school: "قطر التقنية الثانوية للبنات" },
      silver: { name: "منة الله عاطف مصطفى أحمد",            school: "أروى بنت عبد المطلب الثانوية للبنات" },
      bronze: { name: "ساره محمد راغب",                     school: "الإيمان الثانوية للبنات" } },
    { age: "2008",
      gold:   { name: "رزان غسان مرسي",                     school: "الإيمان الثانوية للبنات" },
      silver: { name: "هيا خميس الكبيسي",                   school: "الكعبان الثانوية للبنات" },
      bronze: { name: "فاطمة محمد الجابرية",                 school: "قطر التقنية الثانوية للبنات" } },
    { age: "2007",
      gold:   { name: "سلمى ناصر حامد",                     school: "امنه بنت وهب الثانوية للبنات" },
      silver: { name: "نوره محمد المري",                    school: "الوكرة الثانوية للبنات" },
      bronze: { name: "إيناس محمد الجدوع",                   school: "الإيمان الثانوية للبنات" } },
  ],
};

const MEDALS = [
  { key: "gold",   label: "المركز الأول",  emoji: "🥇", bg: "bg-amber-50",   border: "border-amber-300",  text: "text-amber-700",   num: "text-amber-600",  badge: "bg-amber-100 text-amber-700" },
  { key: "silver", label: "المركز الثاني", emoji: "🥈", bg: "bg-slate-50",   border: "border-slate-300",  text: "text-slate-700",   num: "text-slate-500",  badge: "bg-slate-100 text-slate-600" },
  { key: "bronze", label: "المركز الثالث", emoji: "🥉", bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-700",  num: "text-orange-500", badge: "bg-orange-100 text-orange-700" },
];

/* ── helper: card for one winner ── */
function MedalCard({ medal, winner, unit, lowerBetter }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${medal.bg} ${medal.border} flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${medal.badge}`}>{medal.label}</span>
        <span className="text-2xl">{medal.emoji}</span>
      </div>
      <p className={`text-base font-black leading-tight ${medal.text} font-['Alexandria']`}>{winner.name}</p>
      {winner.score && (
        <div className={`inline-flex items-center gap-1 text-sm font-black ${medal.num}`}>
          <span dir="ltr">{winner.score}</span>
          <span className="text-[10px] font-normal opacity-70">{unit}</span>
          {lowerBetter && <span className="text-[9px] opacity-50">(أقل أفضل)</span>}
        </div>
      )}
      <div className="flex items-start gap-1 pt-2 border-t border-black/5">
        <School className={`w-3 h-3 mt-0.5 shrink-0 opacity-50`} />
        <p className={`text-[11px] leading-relaxed opacity-60 font-medium`}>{winner.school}</p>
      </div>
    </div>
  );
}

function HistoricalSection() {
  const [mode, setMode]     = useState("hist");        // "hist" (2025-2026) | "2025" (2024-2025) | "2024" (2023-2024)
  const [gender, setGender] = useState("بنين");
  const [test, setTest]     = useState("الضغط");

  const TESTS_2024 = Object.keys(WINNERS_2024["بنين"]);
  const stages2024 = Object.keys(WINNERS_2024[gender]?.[test]?.stages ?? {});
  const testData   = WINNERS_2024[gender]?.[test];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-[#8A1538]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A] font-['Alexandria']">نتائج الأعوام السابقة</h2>
          <p className="text-xs text-[#9CA3AF]">الفائزون بمسابقة اللياقة البدنية والصحة · قطر</p>
        </div>
        <span className="mr-auto text-xs px-2.5 py-1 rounded-full bg-[#8A1538]/8 text-[#8A1538] font-semibold border border-[#8A1538]/15 shrink-0">
          🇶🇦 وزارة التربية والتعليم
        </span>
      </div>

      {/* ── Mode toggle: 2023-2024 vs historical ── */}
      <div className="inline-flex rounded-xl border border-[#E5E1D8] bg-[#FDFBF7] p-1 gap-1">
        {[{ k: "hist", label: "2025 – 2026 🆕" }, { k: "2025", label: "2024 – 2025" }, { k: "2024", label: "2023 – 2024" }].map(m => (
          <button key={m.k} onClick={() => setMode(m.k)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              mode === m.k ? "bg-[#8A1538] text-white shadow-sm" : "text-[#6B7280] hover:text-[#8A1538]"
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Gender toggle (shared) ── */}
      <div className="flex items-center gap-2">
        {["بنين", "بنات"].map(g => (
          <button key={g} onClick={() => setGender(g)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all ${
              gender === g
                ? "bg-[#8A1538] text-white border-[#8A1538]"
                : "bg-white text-[#6B7280] border-[#E5E1D8] hover:border-[#8A1538] hover:text-[#8A1538]"
            }`}>
            {g === "بنين" ? "👦" : "👧"} {g}
          </button>
        ))}
      </div>

      {/* ════════════════════
          MODE: 2024-2025
      ════════════════════ */}
      {mode === "2025" && (
        <div className="space-y-4">
          {/* Age group tabs */}
          <div className="flex flex-wrap gap-2" dir="rtl">
            {WINNERS_2025[gender].map(row => (
              <span key={row.age}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#8A1538]/8 text-[#8A1538] border border-[#8A1538]/15">
                مواليد {row.age}
              </span>
            ))}
          </div>

          {/* One row per age group */}
          {WINNERS_2025[gender].map(row => (
            <div key={row.age} className="space-y-2">
              {/* Age label */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#E5E1D8]" />
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#8A1538]/8 text-[#8A1538] border border-[#8A1538]/15 whitespace-nowrap">
                  الفئة العمرية · مواليد {row.age}
                </span>
                <div className="h-px flex-1 bg-[#E5E1D8]" />
              </div>
              {/* 3 medal cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MEDALS.map(medal => {
                  const winner = row[medal.key];
                  return (
                    <div key={medal.key}
                      className={`rounded-2xl border-2 p-4 ${medal.bg} ${medal.border} flex flex-col gap-2.5`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${medal.badge}`}>{medal.label}</span>
                        <span className="text-2xl">{medal.emoji}</span>
                      </div>
                      <p className={`text-base font-black leading-tight ${medal.text} font-['Alexandria']`}>{winner.name}</p>
                      <div className="flex items-start gap-1 pt-2 border-t border-black/5">
                        <School className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                        <p className="text-[11px] leading-relaxed opacity-60 font-medium">{winner.school}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { n: "9",  label: "فئات عمرية" },
              { n: "54", label: "طالب وطالبة فائز" },
              { n: "3",  label: "مستويات (ذهبي · فضي · برونزي)" },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-[#FDFBF7] border border-[#E5E1D8] p-3 text-center">
                <p className="text-xl font-black text-[#8A1538]">{s.n}</p>
                <p className="text-[11px] text-[#9CA3AF] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════
          MODE: 2023-2024
      ════════════════════ */}
      {mode === "2024" && (
        <div className="space-y-5">

          {/* Test selector */}
          <div className="flex flex-wrap gap-2" dir="rtl">
            {TESTS_2024.map(t => {
              const td = WINNERS_2024[gender]?.[t];
              return (
                <button key={t} onClick={() => setTest(t)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                    test === t
                      ? "bg-[#8A1538] text-white border-[#8A1538] shadow-sm"
                      : "bg-white text-[#6B7280] border-[#E5E1D8] hover:border-[#8A1538] hover:text-[#8A1538]"
                  }`}>
                  <span>{td?.icon}</span>
                  <span>{td?.label}</span>
                </button>
              );
            })}
          </div>

          {/* Results: one block per stage */}
          {testData && stages2024.map(stage => (
            <div key={stage} className="space-y-3">
              {/* Stage label */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#E5E1D8]" />
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#8A1538]/8 text-[#8A1538] border border-[#8A1538]/15 whitespace-nowrap">
                  المرحلة {stage}
                </span>
                <div className="h-px flex-1 bg-[#E5E1D8]" />
              </div>
              {/* 3 medal cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MEDALS.map(medal => (
                  <MedalCard
                    key={medal.key}
                    medal={medal}
                    winner={testData.stages[stage][medal.key]}
                    unit={testData.unit}
                    lowerBetter={testData.lowerBetter}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { n: "5", label: "اختبارات" },
              { n: gender === "بنين" ? "4" : "3", label: "مراحل دراسية" },
              { n: gender === "بنين" ? "60" : "45", label: "طالب فائز" },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-[#FDFBF7] border border-[#E5E1D8] p-3 text-center">
                <p className="text-xl font-black text-[#8A1538]">{s.n}</p>
                <p className="text-[11px] text-[#9CA3AF] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════
          MODE: 2025-2026 (results by birth-year age group)
      ════════════════════ */}
      {mode === "hist" && (
        <div className="space-y-4">
          {/* Age group tabs */}
          <div className="flex flex-wrap gap-2" dir="rtl">
            {HISTORICAL_WINNERS[gender].map(row => (
              <span key={row.year}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#8A1538]/8 text-[#8A1538] border border-[#8A1538]/15">
                مواليد {row.year}
              </span>
            ))}
          </div>

          {/* One row per age group */}
          {HISTORICAL_WINNERS[gender].map(row => (
            <div key={row.year} className="space-y-2">
              {/* Age label */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#E5E1D8]" />
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#8A1538]/8 text-[#8A1538] border border-[#8A1538]/15 whitespace-nowrap">
                  الفئة العمرية · مواليد {row.year}
                </span>
                <div className="h-px flex-1 bg-[#E5E1D8]" />
              </div>
              {/* 3 medal cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MEDALS.map(medal => {
                  const winner = row[medal.key];
                  return (
                    <div key={medal.key}
                      className={`rounded-2xl border-2 p-4 ${medal.bg} ${medal.border} flex flex-col gap-2.5`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${medal.badge}`}>{medal.label}</span>
                        <span className="text-2xl">{medal.emoji}</span>
                      </div>
                      <p className={`text-base font-black leading-tight ${medal.text} font-['Alexandria']`}>{winner.name}</p>
                      <div className="flex items-start gap-1 pt-2 border-t border-black/5">
                        <School className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                        <p className="text-[11px] leading-relaxed opacity-60 font-medium">{winner.school}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { n: String(HISTORICAL_WINNERS[gender].length), label: "فئات عمرية" },
              { n: String(HISTORICAL_WINNERS[gender].length * 3 * 2), label: "طالب وطالبة فائز" },
              { n: "3", label: "مستويات (ذهبي · فضي · برونزي)" },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-[#FDFBF7] border border-[#E5E1D8] p-3 text-center">
                <p className="text-xl font-black text-[#8A1538]">{s.n}</p>
                <p className="text-[11px] text-[#9CA3AF] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TESTS = [
  { key: "pushUpScore",      label: "اختبار الضغط",   unit: "تكرار", icon: Dumbbell, color: "#8A1538", lowerBetter: false },
  { key: "sitUpScore",       label: "اختبار البطن",   unit: "تكرار", icon: Heart,    color: "#D4AF37", lowerBetter: false },
  { key: "flexibilityScore", label: "اختبار المرونة", unit: "سم",    icon: Ruler,    color: "#10B981", lowerBetter: false },
  { key: "agilityScore",     label: "اختبار الرشاقة", unit: "ثانية", icon: Zap,      color: "#3B82F6", lowerBetter: true  },
  { key: "enduranceScore",   label: "اختبار التحمل",  unit: "دقيقة", icon: Timer,    color: "#8B5CF6", lowerBetter: false },
];

const STAGES = ["ابتدائي", "إعدادي", "ثانوي"];

// خرائط لربط أكواد الاختبارات بأسمائها العربية في WINNERS_2024
const TEST_NAME_MAP = {
  pushUpScore:      "الضغط",
  sitUpScore:       "البطن",
  flexibilityScore: "المرونة",
  agilityScore:     "الرشاقة",
  enduranceScore:   "التحمل",
};
// المراحل في WINNERS_2024 (النموذجية + الابتدائية → ابتدائي)
const STAGE_2024_MAP = {
  ابتدائي: ["النموذجية", "الابتدائية"],
  إعدادي:  ["الإعدادية"],
  ثانوي:   ["الثانوية"],
};
// تحويل score النصي لرقم للمقارنة (يدعم 3:11.59 للجري)
const parseScoreValue = (s, isTime) => {
  if (s == null) return NaN;
  const str = String(s);
  if (isTime && str.includes(":")) {
    const [m, rest] = str.split(":");
    return parseInt(m, 10) * 60 + parseFloat(rest);
  }
  return parseFloat(str);
};

export default function RecordsPage() {
  const navigate = useNavigate();
  const studentsRaw = useQuery(api.students.list);
  const schoolsRaw  = useQuery(api.schools.list);

  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedStage,  setSelectedStage]  = useState(null);
  const [selectedYear,   setSelectedYear]   = useState("ALL");  // "ALL" | "2025-2026" | "2024-2025" | "2023-2024"

  const schools = useMemo(() => schoolsRaw || [], [schoolsRaw]);
  const students = useMemo(() => studentsRaw || [], [studentsRaw]);

  const schoolGenderMap = useMemo(() => {
    const map = {};
    schools.forEach(s => { map[s._id] = s.gender; });
    return map;
  }, [schools]);

  const filteredStudents = useMemo(() => {
    if (!selectedGender || !selectedStage) return [];
    return students.filter(st => {
      const gender = schoolGenderMap[st.schoolId];
      return gender === selectedGender && st.stage === selectedStage;
    });
  }, [students, selectedGender, selectedStage, schoolGenderMap]);

  // pipeline موحّد (يجمع كل المصادر + ينظّف + يصنّف ديناميكياً)
  const pipeline = useMemo(() => {
    return runRecordsPipeline({
      dbStudents:  students,
      schools,
      winners2024: WINNERS_2024,
      winners2025: WINNERS_2025,             // أبطال 2024-2025 (أسماء بدون أرقام)
      winners2026: HISTORICAL_WINNERS,       // أبطال 2025-2026 (أسماء بدون أرقام)
      results2026: results2026Data,          // 176 طالب بنتائج تفصيلية
      currentAcademicYear: getCurrentAcademicYear(),
    });
  }, [students, schools]);

  // كل السنوات الأكاديمية المتاحة للـ tabs (مرتبة من الأحدث للأقدم)
  const availableYears = useMemo(() => {
    const set = new Set(pipeline.allEntries.map(e => e.academicYear).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [pipeline]);

  // الأرقام القياسية حسب السنة المختارة
  const allRecords = useMemo(() => {
    if (selectedYear === "ALL") return pipeline.records;
    const filtered = pipeline.allEntries.filter(e => e.academicYear === selectedYear);
    return computeRecords(filtered);
  }, [pipeline, selectedYear]);

  // فلتر السجلات حسب الجنس والمرحلة المختارة
  const records = useMemo(() => {
    if (!selectedGender || !selectedStage) return [];
    return TESTS.map(test => {
      const r = allRecords.find(x =>
        x.test === test.key && x.gender === selectedGender && x.stage === selectedStage
      );
      if (!r || !r.holder) return { ...test, holder: null };
      return {
        ...test,
        holder: {
          _id:        r.holder._id || null,
          [test.key]: r.displayScore,
          fullName:   r.holder.fullName,
          schoolName: r.holder.schoolName,
          grade:      r.holder.academicYear || "—",
        },
      };
    });
  }, [allRecords, selectedGender, selectedStage]);

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setSelectedStage(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl" data-testid="records-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-['Alexandria']">الأرقام القياسية</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">أفضل النتائج المسجلة في كل اختبار</p>
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedGender || selectedStage) && (
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]" dir="rtl">
          <button onClick={() => { setSelectedGender(null); setSelectedStage(null); }}
            className="hover:text-[#8A1538] transition-colors">الأرقام القياسية</button>
          {selectedGender && (
            <>
              <ChevronRight className="w-4 h-4 rotate-180" />
              <button onClick={() => setSelectedStage(null)} className="hover:text-[#8A1538] transition-colors">
                {selectedGender}
              </button>
            </>
          )}
          {selectedStage && (
            <>
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="text-[#1A1A1A] font-medium">{selectedStage}</span>
            </>
          )}
        </div>
      )}

      {/* ════ Historical Winners Section ════ */}
      <div className="rounded-2xl border border-[#E5E1D8] bg-white p-6 shadow-sm">
        <HistoricalSection />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E5E1D8]" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8A1538]/8 border border-[#8A1538]/15">
          <Trophy className="w-3.5 h-3.5 text-[#8A1538]" />
          <span className="text-xs font-bold text-[#8A1538]">الأرقام القياسية الحالية</span>
        </div>
        <div className="flex-1 h-px bg-[#E5E1D8]" />
      </div>

      {/* Step 1: Gender */}
      {!selectedGender && (
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[#4B5563] mb-4">اختر النوع لعرض الأرقام القياسية</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "بنين", emoji: "👦", desc: "أرقام قياسية البنين" },
                { value: "بنات", emoji: "👧", desc: "أرقام قياسية البنات" },
              ].map(g => (
                <button key={g.value} onClick={() => handleGenderSelect(g.value)}
                  className="group p-6 rounded-xl border-2 border-[#E5E1D8] hover:border-[#8A1538] hover:bg-[#8A1538]/5 transition-all text-center">
                  <div className="text-4xl mb-3">{g.emoji}</div>
                  <p className="font-bold text-lg text-[#1A1A1A] font-['Alexandria']">{g.value}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{g.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Stage */}
      {selectedGender && !selectedStage && (
        <Card className="border-[#E5E1D8]">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[#4B5563] mb-4">
              اختر المرحلة — {selectedGender === "بنين" ? "👦" : "👧"} {selectedGender}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {STAGES.map((stage, i) => {
                const emojis = ["🏫", "📚", "🎓"];
                const count = students.filter(st =>
                  schoolGenderMap[st.schoolId] === selectedGender && st.stage === stage &&
                  TESTS.some(t => st[t.key] != null && st[t.key] > 0)
                ).length;
                return (
                  <button key={stage} onClick={() => setSelectedStage(stage)}
                    className="p-5 rounded-xl border-2 border-[#E5E1D8] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-center">
                    <div className="text-3xl mb-2">{emojis[i]}</div>
                    <p className="font-bold text-[#1A1A1A] font-['Alexandria']">{stage}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{count} طالب بنتائج</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Records */}
      {selectedGender && selectedStage && (
        <>
          {/* Quick switcher: year + gender + stage tabs */}
          <Card className="border-[#E5E1D8] bg-[#FDFBF7]">
            <CardContent className="p-3 space-y-2.5">
              {/* Year quick switch */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#9CA3AF] shrink-0">السنة:</span>
                <button
                  onClick={() => setSelectedYear("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    selectedYear === "ALL"
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm"
                      : "bg-white text-[#6B7280] border-[#E5E1D8] hover:border-[#1A1A1A]"
                  }`}>
                  كل السنوات
                </button>
                {availableYears.map((y, i) => (
                  <button key={y} onClick={() => setSelectedYear(y)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      selectedYear === y
                        ? "bg-[#8A1538] text-white border-[#8A1538] shadow-sm"
                        : "bg-white text-[#6B7280] border-[#E5E1D8] hover:border-[#8A1538] hover:text-[#8A1538]"
                    }`}>
                    {i === 0 ? `${y} 🆕` : y}
                  </button>
                ))}
              </div>
              {/* Gender quick switch */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#9CA3AF] shrink-0">النوع:</span>
                {[
                  { value: "بنين", emoji: "👦" },
                  { value: "بنات", emoji: "👧" },
                ].map(g => (
                  <button key={g.value} onClick={() => setSelectedGender(g.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      selectedGender === g.value
                        ? "bg-[#8A1538] text-white border-[#8A1538] shadow-sm"
                        : "bg-white text-[#6B7280] border-[#E5E1D8] hover:border-[#8A1538] hover:text-[#8A1538]"
                    }`}>
                    {g.emoji} {g.value}
                  </button>
                ))}
              </div>
              {/* Stage quick switch */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#9CA3AF] shrink-0">المرحلة:</span>
                {STAGES.map((stage, i) => {
                  const emojis = ["🏫", "📚", "🎓"];
                  return (
                    <button key={stage} onClick={() => setSelectedStage(stage)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                        selectedStage === stage
                          ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-sm"
                          : "bg-white text-[#6B7280] border-[#E5E1D8] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      }`}>
                      {emojis[i]} {stage}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#9CA3AF]">
              الأرقام القياسية لمرحلة {selectedStage} - {selectedGender}
              {" "}
              {selectedYear === "ALL" ? "(جميع المواسم)" : `(موسم ${selectedYear})`}
            </p>
          </div>

          {records.every(r => !r.holder) ? (
            <Card className="border-[#E5E1D8]">
              <CardContent className="p-10 text-center">
                <Trophy className="w-10 h-10 mx-auto mb-3 text-[#E5E1D8]" />
                <p className="text-[#9CA3AF]">
                  {selectedYear !== "ALL"
                    ? `لا توجد أرقام قياسية رقمية لموسم ${selectedYear} في هذه الفئة`
                    : "لا توجد أرقام قياسية لهذه الفئة"}
                </p>
                {selectedYear === "2024-2025" && (
                  <p className="text-[11px] text-[#D4AF37] mt-2">
                    📌 بيانات موسم 2024-2025 المتوفرة هي أسماء الفائزين فقط (بدون نتائج رقمية)
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {records.map((test) => {
                const Icon = test.icon;
                return (
                  <Card key={test.key}
                    className={`border-2 transition-all ${test.holder ? "border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:shadow-md" : "border-[#E5E1D8]"}`}>
                    <CardContent className="p-5">
                      {/* Test header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: test.color + "15" }}>
                          <Icon className="w-5 h-5" style={{ color: test.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A1A] text-sm">{test.label}</p>
                          <p className="text-xs text-[#9CA3AF]">{test.unit}</p>
                        </div>
                        {test.lowerBetter && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 mr-auto">↓ أقل أفضل</span>
                        )}
                      </div>

                      {test.holder ? (
                        <>
                          {/* Record value */}
                          <div className="text-center py-3 rounded-lg mb-3"
                            style={{ backgroundColor: test.color + "08" }}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Trophy className="w-4 h-4 text-[#D4AF37]" />
                              <span className="text-[10px] text-[#D4AF37] font-semibold">الرقم القياسي</span>
                            </div>
                            <p className="text-3xl font-black" style={{ color: test.color }} dir="ltr">
                              {test.holder[test.key]}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{test.unit}</p>
                          </div>

                          {/* Record holder */}
                          <div
                            className={`flex items-center gap-2 p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E5E1D8] transition-colors ${test.holder._id ? "cursor-pointer hover:bg-[#F5F3EC]" : ""}`}
                            onClick={() => test.holder._id && navigate(`/students/${test.holder._id}`)}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#8A1538]/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-[#8A1538]">
                                {test.holder.fullName?.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{test.holder.fullName}</p>
                              <p className="text-[11px] text-[#9CA3AF] truncate">
                                {getSchoolDisplayName(test.holder.schoolName)}
                              </p>
                            </div>
                            {test.holder._id && <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0 rotate-180" />}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-[#9CA3AF] text-sm">لا توجد نتائج</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
