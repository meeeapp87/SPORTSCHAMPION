import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

export const get = query({
  args: { id: v.id("students") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getBySchool = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, { schoolId }) => {
    return await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
      .collect();
  },
});

export const create = mutation({
  args: {
    schoolId: v.id("schools"),
    schoolName: v.string(),
    fullName: v.string(),
    stage: v.string(),
    grade: v.string(),
    birthYear: v.number(),
    personalId: v.string(),
    height: v.number(),
    weight: v.number(),
    bmi: v.number(),
    nationality: v.string(),
    pushUpScore: v.optional(v.number()),
    sitUpScore: v.optional(v.number()),
    flexibilityScore: v.optional(v.number()),
    agilityScore: v.optional(v.number()),
    enduranceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) throw new Error("المدرسة غير موجودة");

    const existing = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    if (existing.length >= (school.maxStudents || 3)) {
      throw new Error("تم الوصول للحد الأقصى من الطلاب لهذه المدرسة");
    }

    const dupId = await ctx.db
      .query("students")
      .withIndex("by_personalId", (q) => q.eq("personalId", args.personalId))
      .first();
    if (dupId) throw new Error("الرقم الشخصي مستخدم بالفعل");

    const now = new Date().toISOString();
    return await ctx.db.insert("students", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("students"),
    schoolId: v.optional(v.id("schools")),
    schoolName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    stage: v.optional(v.string()),
    grade: v.optional(v.string()),
    birthYear: v.optional(v.number()),
    personalId: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    bmi: v.optional(v.number()),
    nationality: v.optional(v.string()),
    pushUpScore: v.optional(v.number()),
    sitUpScore: v.optional(v.number()),
    flexibilityScore: v.optional(v.number()),
    agilityScore: v.optional(v.number()),
    enduranceScore: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    updates.updatedAt = new Date().toISOString();
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
