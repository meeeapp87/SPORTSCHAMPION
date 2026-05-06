import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Password Hashing ---

const PBKDF2_PREFIX = "v2:";
const PBKDF2_SALT = new TextEncoder().encode("sports_fitness_app_salt_v2_qatar_2024");

async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "__salt_sports_app_2024__");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: PBKDF2_SALT, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashArray = Array.from(new Uint8Array(bits));
  return PBKDF2_PREFIX + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith(PBKDF2_PREFIX)) {
    return (await hashPassword(password)) === storedHash;
  }
  // Legacy SHA-256 — migrated automatically on next login
  return (await hashPasswordLegacy(password)) === storedHash;
}

// --- Authorization Helper ---

async function requireAdmin(ctx: any, callerId: string) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller) throw new Error("المستخدم غير موجود");
  if (caller.role !== "admin") throw new Error("غير مصرح لك بهذه العملية");
  return caller;
}

async function requireAnyRole(ctx: any, callerId: string, roles: string[]) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller) throw new Error("المستخدم غير موجود");
  if (!roles.includes(caller.role)) throw new Error("غير مصرح لك بهذه العملية");
  return caller;
}

// --- Auth Mutations ---

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
    if (!user) throw new Error("بيانات الدخول غير صحيحة");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new Error("بيانات الدخول غير صحيحة");

    // Upgrade legacy SHA-256 hash to PBKDF2 on successful login
    if (!user.passwordHash.startsWith(PBKDF2_PREFIX)) {
      const newHash = await hashPassword(password);
      await ctx.db.patch(user._id, { passwordHash: newHash });
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      school_id: user.schoolId,
      school_name: user.schoolName,
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
    if (existing) throw new Error("البريد الإلكتروني مستخدم بالفعل");

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
      school_id: user!.schoolId,
      school_name: user!.schoolName,
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
        school_id: user.schoolId,
        school_name: user.schoolName,
      };
    } catch {
      return null;
    }
  },
});

// Admin: list all users (requires admin role)
export const listUsers = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, { callerId }) => {
    await requireAdmin(ctx, callerId);
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      school_id: u.schoolId,
      school_name: u.schoolName,
      createdAt: u.createdAt,
    }));
  },
});

// Admin: create user
export const createUser = mutation({
  args: {
    callerId: v.id("users"),
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.string(),
    schoolId: v.optional(v.string()),
    schoolName: v.optional(v.string()),
  },
  handler: async (ctx, { callerId, email, password, name, role, schoolId, schoolName }) => {
    await requireAdmin(ctx, callerId);

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existing) throw new Error("البريد الإلكتروني مستخدم بالفعل");

    const validRoles = ["admin", "school_user", "trainer", "viewer"];
    const finalRole = validRoles.includes(role) ? role : "viewer";
    const hashedPassword = await hashPassword(password);
    return await ctx.db.insert("users", {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      name,
      role: finalRole,
      schoolId: finalRole === "school_user" ? schoolId : undefined,
      schoolName: finalRole === "school_user" ? schoolName : undefined,
      createdAt: new Date().toISOString(),
    });
  },
});

// Admin: change user password
export const changePassword = mutation({
  args: {
    callerId: v.id("users"),
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, { callerId, userId, newPassword }) => {
    await requireAdmin(ctx, callerId);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("المستخدم غير موجود");
    const hashedPassword = await hashPassword(newPassword);
    await ctx.db.patch(userId, { passwordHash: hashedPassword });
  },
});

// Admin: delete user
export const deleteUser = mutation({
  args: {
    callerId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, { callerId, userId }) => {
    await requireAdmin(ctx, callerId);
    await ctx.db.delete(userId);
  },
});

// Seed admin user (only if no admin exists yet)
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
    if (existing) return { status: "exists", id: existing._id };

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

