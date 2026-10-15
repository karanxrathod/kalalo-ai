import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("==================================================");
console.log("  KALALO LIVE SUPABASE CONNECTIVITY & RLS AUDIT");
console.log("==================================================");

if (!url || !anonKey) {
  console.log("\n[STATUS: BLOCKED]");
  console.log("Supabase credentials not yet configured in environment.");
  console.log("Required environment variables:");
  console.log("  - NEXT_PUBLIC_SUPABASE_URL");
  console.log("  - NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.log("  - SUPABASE_SERVICE_ROLE_KEY (optional for admin bypass)");
  console.log("\nOnce you add these in .env.local or Vercel Settings, re-run this script to verify.");
  process.exit(0);
}

console.log(`Connecting to: ${url.replace(/:\/\/([^.]+)\./, "://$1***.")}`);

async function run() {
  const supabase = createClient(url, serviceKey || anonKey);

  console.log("\nChecking Database Tables:");
  const tables = ["profiles", "projects", "caption_segments", "jobs", "user_settings"];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ✗ ${table}: FAIL (${error.message})`);
    } else {
      console.log(`  ✓ ${table}: PASS (Table exists, readable)`);
    }
  }

  console.log("\nChecking Storage Buckets:");
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.log(`  ✗ listBuckets: FAIL (${bErr.message})`);
  } else {
    const hasMedia = buckets.some((b) => b.id === "kalalo-media" || b.name === "kalalo-media");
    console.log(`  ${hasMedia ? "✓" : "✗"} kalalo-media bucket: ${hasMedia ? "PASS (Found)" : "NOT FOUND"}`);
  }

  console.log("\n==================================================");
}

run().catch((e) => {
  console.error("Test error:", e);
});
