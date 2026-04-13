import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSchool = await ctx.db.query("schools").first();
    if (existingSchool) return { status: "already_seeded" };

    await ctx.db.insert("schools", {
      name: "مدرسة الدوحة الثانوية",
      stage: "ثانوي",
      grades: ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
      allowedBirthYears: [2008, 2009, 2010],
      maxStudents: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("schools", {
      name: "مدرسة الريان الإعدادية",
      stage: "إعدادي",
      grades: ["الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي"],
      allowedBirthYears: [2011, 2012, 2013],
      maxStudents: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("schools", {
      name: "مدرسة الوكرة الابتدائية",
      stage: "ابتدائي",
      grades: ["الرابع", "الخامس", "السادس"],
      allowedBirthYears: [2014, 2015, 2016],
      maxStudents: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

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
