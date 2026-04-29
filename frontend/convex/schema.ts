import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(),
    schoolId: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_email", ["email"]),
  schools: defineTable({
    name: v.string(),
    stage: v.string(),
    gender: v.optional(v.string()),
    grades: v.array(v.string()),
    allowedBirthYears: v.array(v.number()),
    maxStudents: v.number(),
    isActive: v.boolean(),
    createdAt: v.string(),
  }),
  students: defineTable({
    schoolId: v.id("schools"),
    schoolName: v.string(),
    fullName: v.string(),
    stage: v.string(),
    grade: v.string(),
    birthYear: v.number(),
    personalId: v.string(),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    bmi: v.optional(v.number()),
    nationality: v.string(),
    pushUpScore: v.optional(v.number()),
    sitUpScore: v.optional(v.number()),
    flexibilityScore: v.optional(v.number()),
    agilityScore: v.optional(v.number()),
    enduranceScore: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_school", ["schoolId"])
    .index("by_personalId", ["personalId"]),
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),
});
