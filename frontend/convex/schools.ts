import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: any, callerId: string) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller) throw new Error("المستخدم غير موجود");
  if (caller.role !== "admin") throw new Error("غير مصرح لك بهذه العملية");
  return caller;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("schools").collect();
  },
});

export const get = query({
  args: { id: v.id("schools") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    callerId: v.id("users"),
    name: v.string(),
    stage: v.string(),
    gender: v.optional(v.string()),
    grades: v.array(v.string()),
    allowedBirthYears: v.array(v.number()),
    maxStudents: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, { callerId, ...schoolData }) => {
    await requireAdmin(ctx, callerId);
    return await ctx.db.insert("schools", {
      ...schoolData,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    callerId: v.id("users"),
    id: v.id("schools"),
    name: v.optional(v.string()),
    stage: v.optional(v.string()),
    gender: v.optional(v.string()),
    grades: v.optional(v.array(v.string())),
    allowedBirthYears: v.optional(v.array(v.number())),
    maxStudents: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { callerId, id, ...fields }) => {
    await requireAdmin(ctx, callerId);
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    callerId: v.id("users"),
    id: v.id("schools"),
  },
  handler: async (ctx, { callerId, id }) => {
    await requireAdmin(ctx, callerId);
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", id))
      .collect();
    for (const student of students) {
      await ctx.db.delete(student._id);
    }
    await ctx.db.delete(id);
  },
});
