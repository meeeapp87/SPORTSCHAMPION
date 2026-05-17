import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSchool = await ctx.db.query("schools").first();
    if (existingSchool) return { status: "already_seeded" };

    const school1 = await ctx.db.insert("schools", {
      name: "مدرسة الدوحة الثانوية",
      stage: "ثانوي",
      grades: ["10", "11", "12"],
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
      { schoolId: school1, schoolName: "مدرسة الدوحة الثانوية", fullName: "أحمد محمد العلي", stage: "ثانوي", grade: "10", birthYear: 2009, personalId: "29901001", nationality: "قطري", height: 175, weight: 68, pushUpScore: 45, sitUpScore: 40, flexibilityScore: 35, agilityScore: 42, enduranceScore: 38 },
      { schoolId: school1, schoolName: "مدرسة الدوحة الثانوية", fullName: "خالد عبدالله الهاجري", stage: "ثانوي", grade: "11", birthYear: 2008, personalId: "29901002", nationality: "قطري", height: 180, weight: 75, pushUpScore: 50, sitUpScore: 48, flexibilityScore: 30, agilityScore: 44, enduranceScore: 42 },
      { schoolId: school1, schoolName: "مدرسة الدوحة الثانوية", fullName: "سعد ناصر المري", stage: "ثانوي", grade: "12", birthYear: 2010, personalId: "29901003", nationality: "قطري", height: 170, weight: 65, pushUpScore: 38, sitUpScore: 35, flexibilityScore: 40, agilityScore: 36, enduranceScore: 34 },
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

// إصلاح أسماء المدارس المكسورة في قاعدة البيانات
export const fixSchoolNames = mutation({
  args: {
    schools: v.array(v.object({ english: v.string(), arabic: v.string() })),
  },
  handler: async (ctx, { schools }) => {
    const CP1252: Record<number, number> = {
      0x0160: 0x8A, 0x2020: 0x86, 0x201E: 0x84, 0x2026: 0x85,
      0x02C6: 0x88, 0x201A: 0x82, 0x0161: 0x9A, 0x017E: 0x9E,
      0x017D: 0x8E, 0x0152: 0x8C, 0x0153: 0x9C, 0x0192: 0x83,
      0x02DC: 0x98, 0x2039: 0x8B, 0x203A: 0x9B, 0x2018: 0x91,
      0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2013: 0x96,
      0x2014: 0x97, 0x2022: 0x95, 0x20AC: 0x80,
    };

    function fixMojibake(text: string): string | null {
      if (!text.includes("Ø") && !text.includes("Ù")) return null;
      try {
        const bytes: number[] = [];
        for (const c of text) {
          const o = c.codePointAt(0)!;
          if (o <= 0xFF) bytes.push(o);
          else if (CP1252[o] !== undefined) bytes.push(CP1252[o]);
          else return null;
        }
        const decoded = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
        if (/[؀-ۿ]/.test(decoded)) return decoded.trim();
        return null;
      } catch { return null; }
    }

    const allSchools = await ctx.db.query("schools").collect();
    let fixed = 0;
    for (const school of allSchools) {
      const fixedName = fixMojibake(school.name);
      if (fixedName) {
        await ctx.db.patch(school._id, { name: fixedName });
        fixed++;
      }
    }
    return { fixed, total: allSchools.length };
  },
});

// استيراد كل المدارس من JSON
export const seedAllSchools = mutation({
  args: {
    schools: v.array(v.object({
      name: v.string(),
      stage: v.string(),
      gender: v.string(),
      grades: v.array(v.string()),
    })),
  },
  handler: async (ctx, { schools }) => {
    const existing = await ctx.db.query("schools").collect();
    const existingNames = new Set(existing.map((s) => s.name));
    let added = 0;
    for (const school of schools) {
      if (!existingNames.has(school.name)) {
        await ctx.db.insert("schools", {
          name: school.name,
          stage: school.stage,
          gender: school.gender,
          grades: school.grades,
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

// تصحيح الحد الأقصى للطلاب لكل المدارس
export const fixMaxStudents = mutation({
  args: { maxStudents: v.number() },
  handler: async (ctx, { maxStudents }) => {
    const allSchools = await ctx.db.query("schools").collect();
    let fixed = 0;
    for (const school of allSchools) {
      if (school.maxStudents !== maxStudents) {
        await ctx.db.patch(school._id, { maxStudents });
        fixed++;
      }
    }
    return { fixed, total: allSchools.length };
  },
});

// حذف كل المدارس
export const deleteAllSchools = mutation({
  args: {},
  handler: async (ctx) => {
    const allSchools = await ctx.db.query("schools").collect();
    let deleted = 0;
    for (const school of allSchools) {
      await ctx.db.delete(school._id);
      deleted++;
    }
    return { deleted };
  },
});

export const seedAdminZero = mutation({
  args: {},
  handler: async (ctx) => {
    // Hash password "123456"
    const encoder = new TextEncoder();
    const data = encoder.encode("123456" + "__salt_sports_app_2024__");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    await ctx.db.insert("users", {
      email: "admin@sports.com",
      passwordHash: hashedPassword,
      name: "مدير النظام",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    return "ok"
  }
});
