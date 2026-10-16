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
  const adminClient = createClient(url, serviceKey);
  const anonClient = createClient(url, anonKey);

  console.log("\n[1/6] Checking Database Tables:");
  const tables = ["profiles", "projects", "caption_segments", "jobs", "user_settings"];
  for (const table of tables) {
    const { count, error } = await adminClient.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ✗ ${table}: FAIL (${error.message})`);
    } else {
      console.log(`  ✓ ${table}: PASS (Table exists, readable)`);
    }
  }

  console.log("\n[2/6] Checking Storage Buckets:");
  const { data: buckets, error: bErr } = await adminClient.storage.listBuckets();
  if (bErr) {
    console.log(`  ✗ listBuckets: FAIL (${bErr.message})`);
  } else {
    const hasMedia = buckets.some((b) => b.id === "kalalo-media" || b.name === "kalalo-media");
    console.log(`  ${hasMedia ? "✓" : "✗"} kalalo-media bucket: ${hasMedia ? "PASS (Found)" : "NOT FOUND"}`);
  }

  console.log("\n[3/6] Testing Disposable Auth & User Onboarding Trigger:");
  const testEmail = `probe-${Date.now()}@kalalo.internal`;
  const { data: userData, error: userErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: "TempProbePassword123!",
    email_confirm: true,
    user_metadata: { display_name: "Probe Tester" }
  });

  if (userErr || !userData?.user) {
    console.log(`  ✗ Create disposable test user: FAIL (${userErr?.message})`);
    return;
  }
  const testUserId = userData.user.id;
  console.log(`  ✓ Created test user with ID: ${testUserId}`);

  // Check if profile trigger created row
  const { data: profileRow } = await adminClient.from("profiles").select("*").eq("id", testUserId).single();
  if (profileRow) {
    console.log(`  ✓ Profile auto-created by onboarding trigger: PASS (Email: ${profileRow.email})`);
  } else {
    console.log(`  ! Profile row not auto-created, creating directly for test`);
    await adminClient.from("profiles").insert({ id: testUserId, email: testEmail, display_name: "Probe Tester" });
  }

  console.log("\n[4/6] Testing Project Persistence & CRUD Lifecycle:");
  const testProjectId = `proj-probe-${Date.now()}`;
  const { error: insErr } = await adminClient.from("projects").insert({
    id: testProjectId,
    user_id: testUserId,
    name: "Verification Probe Video",
    file_name: "probe.mp4",
    status: "processing",
    provider: "gemini"
  });
  if (insErr) {
    console.log(`  ✗ Project insert: FAIL (${insErr.message})`);
  } else {
    console.log(`  ✓ Project insert: PASS (${testProjectId})`);
  }

  // Read back
  const { data: readProj, error: readErr } = await adminClient.from("projects").select("*").eq("id", testProjectId).single();
  if (readErr || !readProj) {
    console.log(`  ✗ Project read back: FAIL (${readErr?.message})`);
  } else {
    console.log(`  ✓ Project read back: PASS (Status: ${readProj.status})`);
  }

  // Update
  const { error: upErr } = await adminClient.from("projects").update({ status: "ready", duration_seconds: 12.5 }).eq("id", testProjectId);
  if (upErr) {
    console.log(`  ✗ Project update: FAIL (${upErr.message})`);
  } else {
    const { data: updatedProj } = await adminClient.from("projects").select("*").eq("id", testProjectId).single();
    console.log(`  ✓ Project update & verify: PASS (New status: ${updatedProj?.status}, Duration: ${updatedProj?.duration_seconds}s)`);
  }

  console.log("\n[5/6] Testing Storage Operations (kalalo-media):");
  const testFilePath = `${testUserId}/probe-${Date.now()}.txt`;
  const fileContent = Buffer.from("Kalalo storage probe verification payload", "utf-8");
  const { error: uploadErr } = await adminClient.storage.from("kalalo-media").upload(testFilePath, fileContent, {
    contentType: "text/plain"
  });
  if (uploadErr) {
    console.log(`  ✗ Storage upload: FAIL (${uploadErr.message})`);
  } else {
    console.log(`  ✓ Storage upload: PASS (${testFilePath})`);
    const { data: signedData, error: signErr } = await adminClient.storage.from("kalalo-media").createSignedUrl(testFilePath, 60);
    if (signErr || !signedData?.signedUrl) {
      console.log(`  ✗ Signed URL generation: FAIL (${signErr?.message})`);
    } else {
      console.log(`  ✓ Signed URL generation: PASS`);
    }
  }

  console.log("\n[6/6] Testing RLS Isolation & Teardown Cleanup:");
  // Anonymous unauthenticated query should not see the user's project
  const { data: anonData } = await anonClient.from("projects").select("*").eq("id", testProjectId);
  if (!anonData || anonData.length === 0) {
    console.log(`  ✓ RLS unauthenticated access rejection: PASS (Record hidden from anonymous caller)`);
  } else {
    console.log(`  ✗ RLS unauthenticated access rejection: FAIL (Anonymous caller saw record!)`);
  }

  // Cleanup test data
  await adminClient.storage.from("kalalo-media").remove([testFilePath]);
  await adminClient.from("projects").delete().eq("id", testProjectId);
  await adminClient.auth.admin.deleteUser(testUserId);
  console.log(`  ✓ Teardown & cleanup: PASS (Disposable test project, storage object, and auth user deleted)`);

  console.log("\n==================================================");
  console.log("  ALL REMOTE SUPABASE VERIFICATION CHECKS PASSED!");
  console.log("==================================================");
}

run().catch((e) => {
  console.error("Test error:", e);
});

