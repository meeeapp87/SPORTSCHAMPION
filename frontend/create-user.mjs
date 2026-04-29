import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CLOUD_URL = process.env.REACT_APP_CONVEX_URL;
const client = new ConvexHttpClient(CLOUD_URL);

// ← غيّر هذه البيانات حسب اليوزر الذي كان على المحلي
const EMAIL = "eng.mohamed87@live.com";  // غيّر هذا للبريد الصحيح
const NAME  = "محمد";                    // غيّر هذا للاسم الصحيح
const PASS  = "123456";                  // كلمة مرور مؤقتة (يمكن تغييرها لاحقاً)
const ROLE  = "admin";                   // admin | school_user | trainer | viewer

async function main() {
  try {
    const res = await client.mutation("auth:seedAdmin", {
      email: EMAIL,
      password: PASS,
      name: NAME,
    });
    console.log("✅ User created/found:", res);
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${PASS}`);
    console.log(`   Role: ${ROLE}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();
