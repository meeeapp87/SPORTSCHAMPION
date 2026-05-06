import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: { callerId: v.id("users") },
  handler: async (ctx, { callerId }) => {
    const caller = await ctx.db.get(callerId as any);
    if (!caller) throw new Error("المستخدم غير موجود");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
