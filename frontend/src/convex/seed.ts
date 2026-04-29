import { mutation } from "./_generated/server";
import { v } from "convex/values";

// حذف كل المدارس (للـ reset)
export const deleteAllSchools = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("schools").collect();
    for (const s of all) await ctx.db.delete(s._id);
    return { deleted: all.length };
  },
});

export const seedAllSchools = mutation({
  args: {
    schools: v.array(v.object({
      name: v.string(),    // الاسم العربي فقط
      english: v.string(),
      arabic: v.string(),
      stage: v.string(),
      gender: v.string(),
      grades: v.array(v.string()),
    })),
  },
  handler: async (ctx, { schools }) => {
    const existing = await ctx.db.query("schools").collect();
    const existingNames = new Set(existing.map(s => s.name));

    let added = 0;
    for (const s of schools) {
      if (!existingNames.has(s.name)) {
        await ctx.db.insert("schools", {
          name: s.name,       // يُخزَّن بالعربي فقط
          stage: s.stage,
          gender: s.gender,
          grades: s.grades,
          allowedBirthYears: [],
          maxStudents: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        added++;
      }
    }
    return { added, total: schools.length };
  },
});

export const fixSchoolNames = mutation({
  args: {
    schools: v.array(v.object({
      english: v.string(),
      arabic: v.string(),
    })),
  },
  handler: async (ctx, { schools }) => {
    // map: english → arabic  AND  decoded-arabic → arabic
    const byEnglish: Record<string, string> = {};
    const byArabic: Record<string, string> = {};
    for (const s of schools) {
      byEnglish[s.english] = s.arabic;
      byArabic[s.arabic] = s.arabic; // identity (already correct)
    }

    // helper: try to fix garbled UTF-8 stored as Latin-1
    const tryDecode = (str: string): string => {
      try {
        return decodeURIComponent(escape(str));
      } catch {
        return str;
      }
    };

    const all = await ctx.db.query("schools").collect();
    let fixed = 0;

    for (const school of all) {
      let correctName: string | undefined;

      // 1) اسم فيه " / " → جلب الجزء الإنجليزي والبحث به
      if (school.name?.includes(" / ")) {
        const eng = school.name.split(" / ")[0]?.trim();
        correctName = byEnglish[eng];
      }

      // 2) محاولة decode الاسم المكسور ومطابقته بالعربي
      if (!correctName) {
        const decoded = tryDecode(school.name || "");
        if (decoded !== school.name && byArabic[decoded]) {
          correctName = decoded;
        }
      }

      // 3) اسم مكسور يحتوي على " / " بعد الـ decode
      if (!correctName) {
        const decoded = tryDecode(school.name || "");
        if (decoded.includes(" / ")) {
          const arabicPart = decoded.split(" / ")[1]?.trim();
          if (arabicPart && byArabic[arabicPart]) correctName = arabicPart;
          // أو من الإنجليزي
          const engPart = decoded.split(" / ")[0]?.trim();
          if (!correctName && engPart && byEnglish[engPart]) correctName = byEnglish[engPart];
        }
      }

      if (correctName && correctName !== school.name) {
        await ctx.db.patch(school._id, { name: correctName });
        fixed++;
      }
    }
    return { fixed, total: all.length };
  },
});

export const fixMaxStudents = mutation({
  args: { maxStudents: v.optional(v.number()) },
  handler: async (ctx, { maxStudents = 3 }) => {
    const all = await ctx.db.query("schools").collect();
    let fixed = 0;
    for (const school of all) {
      if (school.maxStudents !== maxStudents) {
        await ctx.db.patch(school._id, { maxStudents });
        fixed++;
      }
    }
    return { fixed, total: all.length };
  },
});

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSchool = await ctx.db.query("schools").first();
    if (existingSchool) return { status: "already_seeded" };

    const school1 = await ctx.db.insert("schools", {
      name: "مدرسة الدوحة الثانوية",
      stage: "ثانوي",
      grades: ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
      allowedBirthYears: [2008, 2009, 2010],
      maxStudents: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const school2 = await ctx.db.insert("schools", {
      name: "مدرسة الريان الإعدادية",
      stage: "إعدادي",
      grades: ["الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي"],
      allowedBirthYears: [2011, 2012, 2013],
      maxStudents: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const school3 = await ctx.db.insert("schools", {
      name: "مدرسة الوكرة الابتدائية",
      stage: "ابتدائي",
      grades: ["الرابع", "الخامس", "السادس"],
      allowedBirthYears: [2014, 2015, 2016],
      maxStudents: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const now = new Date().toISOString();
    const studentsData = [
      { schoolId: school1, schoolName: "مدرسة الدوحة الثانوية", fullName: "أحمد محمد العلي", stage: "ثانوي", grade: "الأول الثانوي", birthYear: 2009, personalId: "29901001", nationality: "قطري", height: 175, weight: 68, pushUpScore: 45, sitUpScore: 40, flexibilityScore: 35, agilityScore: 42, enduranceScore: 38 },
      { schoolId: school1, schoolName: "مدرسة الدوحة الثانوية", fullName: "خالد عبدالله الهاجري", stage: "ثانوي", grade: "الثاني الثانوي", birthYear: 2008, personalId: "29901002", nationality: "قطري", height: 180, weight: 75, pushUpScore: 50, sitUpScore: 48, flexibilityScore: 30, agilityScore: 44, enduranceScore: 42 },
      { schoolId: school1, schoolName: "مدرسة الدوحة الثانوية", fullName: "سعد ناصر المري", stage: "ثانوي", grade: "الثالث الثانوي", birthYear: 2010, personalId: "29901003", nationality: "قطري", height: 170, weight: 65, pushUpScore: 38, sitUpScore: 35, flexibilityScore: 40, agilityScore: 36, enduranceScore: 34 },
      { schoolId: school2, schoolName: "مدرسة الريان الإعدادية", fullName: "يوسف علي الكواري", stage: "إعدادي", grade: "الأول الإعدادي", birthYear: 2012, personalId: "29901004", nationality: "قطري", height: 160, weight: 52, pushUpScore: 35, sitUpScore: 38, flexibilityScore: 42, agilityScore: 40, enduranceScore: 36 },
      { schoolId: school2, schoolName: "مدرسة الريان الإعدادية", fullName: "عمر حسن المهندي", stage: "إعدادي", grade: "الثاني الإعدادي", birthYear: 2011, personalId: "29901005", nationality: "قطري", height: 165, weight: 58, pushUpScore: 42, sitUpScore: 44, flexibilityScore: 38, agilityScore: 46, enduranceScore: 40 },
      { schoolId: school2, schoolName: "مدرسة الريان الإعدادية", fullName: "فهد جاسم النعيمي", stage: "إعدادي", grade: "الثالث الإعدادي", birthYear: 2013, personalId: "29901006", nationality: "قطري", height: 155, weight: 48, pushUpScore: 30, sitUpScore: 32, flexibilityScore: 28, agilityScore: 34, enduranceScore: 30 },
      { schoolId: school3, schoolName: "مدرسة الوكرة الابتدائية", fullName: "راشد سالم الدوسري", stage: "ابتدائي", grade: "الرابع", birthYear: 2015, personalId: "29901007", nationality: "قطري", height: 140, weight: 38, pushUpScore: 25, sitUpScore: 28, flexibilityScore: 32, agilityScore: 30, enduranceScore: 26 },
      { schoolId: school3, schoolName: "مدرسة الوكرة الابتدائية", fullName: "حمد بدر الشمري", stage: "ابتدائي", grade: "الخامس", birthYear: 2014, personalId: "29901008", nationality: "قطري", height: 145, weight: 42, pushUpScore: 28, sitUpScore: 30, flexibilityScore: 34, agilityScore: 32, enduranceScore: 28 },
      { schoolId: school3, schoolName: "مدرسة الوكرة الابتدائية", fullName: "تركي محمد الكبيسي", stage: "ابتدائي", grade: "السادس", birthYear: 2016, personalId: "29901009", nationality: "قطري", height: 135, weight: 35, pushUpScore: 22, sitUpScore: 24, flexibilityScore: 26, agilityScore: 28, enduranceScore: 22 },
    ];

    for (const st of studentsData) {
      const bmi = st.weight / ((st.height / 100) ** 2);
      await ctx.db.insert("students", {
        ...st,
        bmi: Math.round(bmi * 10) / 10,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("settings", {
      key: "maxStudentsPerSchool",
      value: 3,
      updatedAt: new Date().toISOString(),
    });

    await ctx.db.insert("settings", {
      key: "enforceUniqueBirthYear",
      value: true,
      updatedAt: new Date().toISOString(),
    });

    return { status: "seeded" };
  },
});

export const seedStudents = mutation({
  args: {},
  handler: async (ctx) => {
    const existingStudent = await ctx.db.query("students").first();
    if (existingStudent) return { status: "already_seeded" };

    const schools = await ctx.db.query("schools").collect();
    if (schools.length === 0) return { status: "no_schools" };

    const now = new Date().toISOString();
    const studentsData = [
      { schoolIdx: 0, fullName: "أحمد محمد العلي", grade: 0, birthYearIdx: 1, personalId: "29901001", nationality: "قطري", height: 175, weight: 68, pushUpScore: 45, sitUpScore: 40, flexibilityScore: 35, agilityScore: 42, enduranceScore: 38 },
      { schoolIdx: 0, fullName: "خالد عبدالله الهاجري", grade: 1, birthYearIdx: 0, personalId: "29901002", nationality: "قطري", height: 180, weight: 75, pushUpScore: 50, sitUpScore: 48, flexibilityScore: 30, agilityScore: 44, enduranceScore: 42 },
      { schoolIdx: 0, fullName: "سعد ناصر المري", grade: 2, birthYearIdx: 2, personalId: "29901003", nationality: "قطري", height: 170, weight: 65, pushUpScore: 38, sitUpScore: 35, flexibilityScore: 40, agilityScore: 36, enduranceScore: 34 },
      { schoolIdx: 1, fullName: "يوسف علي الكواري", grade: 0, birthYearIdx: 1, personalId: "29901004", nationality: "قطري", height: 160, weight: 52, pushUpScore: 35, sitUpScore: 38, flexibilityScore: 42, agilityScore: 40, enduranceScore: 36 },
      { schoolIdx: 1, fullName: "عمر حسن المهندي", grade: 1, birthYearIdx: 0, personalId: "29901005", nationality: "قطري", height: 165, weight: 58, pushUpScore: 42, sitUpScore: 44, flexibilityScore: 38, agilityScore: 46, enduranceScore: 40 },
      { schoolIdx: 1, fullName: "فهد جاسم النعيمي", grade: 2, birthYearIdx: 2, personalId: "29901006", nationality: "قطري", height: 155, weight: 48, pushUpScore: 30, sitUpScore: 32, flexibilityScore: 28, agilityScore: 34, enduranceScore: 30 },
      { schoolIdx: 2, fullName: "راشد سالم الدوسري", grade: 0, birthYearIdx: 1, personalId: "29901007", nationality: "قطري", height: 140, weight: 38, pushUpScore: 25, sitUpScore: 28, flexibilityScore: 32, agilityScore: 30, enduranceScore: 26 },
      { schoolIdx: 2, fullName: "حمد بدر الشمري", grade: 1, birthYearIdx: 0, personalId: "29901008", nationality: "قطري", height: 145, weight: 42, pushUpScore: 28, sitUpScore: 30, flexibilityScore: 34, agilityScore: 32, enduranceScore: 28 },
      { schoolIdx: 2, fullName: "تركي محمد الكبيسي", grade: 2, birthYearIdx: 2, personalId: "29901009", nationality: "قطري", height: 135, weight: 35, pushUpScore: 22, sitUpScore: 24, flexibilityScore: 26, agilityScore: 28, enduranceScore: 22 },
    ];

    for (const st of studentsData) {
      const school = schools[st.schoolIdx % schools.length];
      const bmi = st.weight / ((st.height / 100) ** 2);
      await ctx.db.insert("students", {
        schoolId: school._id,
        schoolName: school.name,
        fullName: st.fullName,
        stage: school.stage,
        grade: school.grades?.[st.grade] || school.stage,
        birthYear: school.allowedBirthYears?.[st.birthYearIdx] || 2010,
        personalId: st.personalId,
        nationality: st.nationality,
        height: st.height,
        weight: st.weight,
        bmi: Math.round(bmi * 10) / 10,
        pushUpScore: st.pushUpScore,
        sitUpScore: st.sitUpScore,
        flexibilityScore: st.flexibilityScore,
        agilityScore: st.agilityScore,
        enduranceScore: st.enduranceScore,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { status: "seeded" };
  },
});
