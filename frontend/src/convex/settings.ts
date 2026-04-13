import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("settings").collect();
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert("settings", {
        key,
        value,
        updatedAt: new Date().toISOString(),
      });
    }
  },
});
