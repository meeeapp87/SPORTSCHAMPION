import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "__salt_sports_app_2024__");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (!user) {
      throw new Error("بيانات الدخول غير صحيحة");
    }
    const hashedPassword = await hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
      throw new Error("بيانات الدخول غير صحيحة");
    }
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      schoolName: user.schoolName,
    };
  },
});

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, { email, password, name, role }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existing) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }
    const hashedPassword = await hashPassword(password);
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      name,
      role: role || "viewer",
      createdAt: new Date().toISOString(),
    });
    const user = await ctx.db.get(userId);
    return {
      id: user!._id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      schoolId: user!.schoolId,
      schoolName: user!.schoolName,
    };
  },
});

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    try {
      const user = await ctx.db.get(userId as any);
      if (!user) return null;
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
      };
    } catch {
      return null;
    }
  },
});

// Admin: list all users
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      schoolId: u.schoolId,
      schoolName: u.schoolName,
      createdAt: u.createdAt,
    }));
  },
});

// Admin: create user
export const createUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.string(),
    schoolId: v.optional(v.string()),
    schoolName: v.optional(v.string()),
  },
  handler: async (ctx, { email, password, name, role, schoolId, schoolName }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existing) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }
    const validRoles = ["admin", "school_user", "trainer", "viewer"];
    const finalRole = validRoles.includes(role) ? role : "viewer";
    const hashedPassword = await hashPassword(password);
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      name,
      role: finalRole,
      schoolId: finalRole === "school_user" ? schoolId : undefined,
      schoolName: finalRole === "school_user" ? schoolName : undefined,
      createdAt: new Date().toISOString(),
    });
    return userId;
  },
});

// Admin: change user password
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, { userId, newPassword }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("المستخدم غير موجود");
    const hashedPassword = await hashPassword(newPassword);
    await ctx.db.patch(userId, { passwordHash: hashedPassword });
  },
});

// Admin: delete user
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.delete(userId);
  },
});

// Seed admin user
export const seedAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, password, name }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existing) {
      return { status: "exists", id: existing._id };
    }
    const hashedPassword = await hashPassword(password);
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      name,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    return { status: "created", id: userId };
  },
});
