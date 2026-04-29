/**
 * Migration script: copies data from local Convex backend (port 3210)
 * to the Cloud Development deployment (fiery-bullfrog-978).
 *
 * Run once with:  node migrate-local-to-cloud.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const LOCAL_URL = "http://127.0.0.1:3210";
const CLOUD_URL = process.env.REACT_APP_CONVEX_URL;

if (!CLOUD_URL) {
  console.error("❌ REACT_APP_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const local = new ConvexHttpClient(LOCAL_URL);
const cloud = new ConvexHttpClient(CLOUD_URL);

async function migrate() {
  console.log("🔄 Starting migration from local → cloud...\n");

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  console.log("👤 Migrating users...");
  let users = [];
  try {
    users = await local.query("auth:listUsers");
    console.log(`   Found ${users.length} user(s) in local`);
  } catch (e) {
    console.warn("   ⚠️  Could not read users from local:", e.message);
  }

  for (const u of users) {
    try {
      // We can't read the passwordHash directly through listUsers (it returns safe fields),
      // so we call the internal raw approach via a helper we'll add.
      // For now, reset password to "123456" for migrated users, user can change later.
      await cloud.mutation("auth:seedAdmin", {
        email: u.email,
        password: "123456",
        name: u.name,
      });
      console.log(`   ✅ Migrated user: ${u.email} (password set to 123456)`);
    } catch (e) {
      if (e.message?.includes("مستخدم بالفعل") || e.message?.includes("already")) {
        console.log(`   ⏭️  User already exists: ${u.email}`);
      } else {
        console.warn(`   ❌ Failed to migrate user ${u.email}:`, e.message);
      }
    }
  }

  // ── 2. SCHOOLS ────────────────────────────────────────────────────────────
  console.log("\n🏫 Migrating schools...");
  let schools = [];
  try {
    schools = await local.query("schools:list");
    console.log(`   Found ${schools.length} school(s) in local`);
  } catch (e) {
    console.warn("   ⚠️  Could not read schools from local:", e.message);
  }

  const schoolIdMap = {}; // maps old local _id → new cloud _id

  for (const s of schools) {
    try {
      const newId = await cloud.mutation("schools:create", {
        name: s.name,
        stage: s.stage,
        gender: s.gender,
        grades: s.grades || [],
        allowedBirthYears: s.allowedBirthYears || [],
        maxStudents: s.maxStudents || 3,
        isActive: s.isActive ?? true,
      });
      schoolIdMap[s._id] = newId;
      console.log(`   ✅ Migrated school: ${s.name}`);
    } catch (e) {
      console.warn(`   ❌ Failed to migrate school ${s.name}:`, e.message);
    }
  }

  // ── 3. STUDENTS ───────────────────────────────────────────────────────────
  console.log("\n🎓 Migrating students...");
  let students = [];
  try {
    students = await local.query("students:list");
    console.log(`   Found ${students.length} student(s) in local`);
  } catch (e) {
    console.warn("   ⚠️  Could not read students from local:", e.message);
  }

  for (const st of students) {
    try {
      const newSchoolId = schoolIdMap[st.schoolId] || st.schoolId;
      await cloud.mutation("students:createBasic", {
        schoolId: newSchoolId,
        schoolName: st.schoolName,
        fullName: st.fullName,
        stage: st.stage,
        grade: st.grade,
        birthYear: st.birthYear,
        personalId: st.personalId,
        nationality: st.nationality,
        gender: st.gender,
      });
      console.log(`   ✅ Migrated student: ${st.fullName}`);
    } catch (e) {
      console.warn(`   ❌ Failed to migrate student ${st.fullName}:`, e.message);
    }
  }

  // ── 4. SETTINGS ───────────────────────────────────────────────────────────
  console.log("\n⚙️  Migrating settings...");
  let settings = [];
  try {
    settings = await local.query("settings:getAll");
    console.log(`   Found ${settings.length} setting(s) in local`);
  } catch (e) {
    console.warn("   ⚠️  Could not read settings from local:", e.message);
  }

  for (const s of settings) {
    try {
      await cloud.mutation("settings:set", { key: s.key, value: s.value });
      console.log(`   ✅ Migrated setting: ${s.key}`);
    } catch (e) {
      console.warn(`   ❌ Failed to migrate setting ${s.key}:`, e.message);
    }
  }

  console.log("\n✅ Migration complete!");
  console.log("\n📌 IMPORTANT: All migrated users now have password: 123456");
  console.log("   Ask each user to change their password after login.\n");
}

migrate().catch(console.error);
