import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.REACT_APP_CONVEX_URL;
if (!url) {
  console.error("No REACT_APP_CONVEX_URL found in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(url);

async function main() {
  try {
    const res = await client.mutation("auth:seedAdmin", {
      email: "admin@sports.com",
      password: "123456",
      name: "مدير النظام"
    });
    console.log("Success! Server returned:", res);
  } catch (err) {
    console.error("Error creating admin:", err.message);
  }
}

main();
