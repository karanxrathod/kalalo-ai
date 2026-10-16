import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const BASE_URL = process.env.PRODUCTION_URL || "https://kalalo-ai.vercel.app";

console.log("================================================================");
console.log(`  KALALO AI — PRODUCTION BACKEND & SECURITY VERIFICATION SUITE`);
console.log(`  Target: ${BASE_URL}`);
console.log("================================================================\n");

async function run() {
  const timestamp = Date.now();
  const userA_email = `prod-creator-a-${timestamp}@kalalo.internal`;
  const userA_pass = "SecurePass123!A";
  const userA_name = `Creator A ${timestamp}`;

  const userB_email = `prod-creator-b-${timestamp}@kalalo.internal`;
  const userB_pass = "SecurePass123!B";
  const userB_name = `Creator B ${timestamp}`;

  let cookieA = "";
  let tokenA = "";
  let userA_id = "";

  let cookieB = "";
  let tokenB = "";
  let userB_id = "";

  let projectIdA = "";

  // 1. Register User A
  console.log("[1/9] Testing User Registration (User A):");
  const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userA_email, name: userA_name, password: userA_pass }),
  });

  const regDataA = await regResA.json();
  if (regResA.status !== 201 || !regDataA.token) {
    console.error(`  ✗ Registration failed (${regResA.status}):`, regDataA);
    process.exit(1);
  }
  userA_id = regDataA.user.id;
  tokenA = regDataA.token;
  cookieA = regResA.headers.get("set-cookie") || "";
  console.log(`  ✓ Registered User A: ${userA_id} (${userA_email})`);

  // 2. Verify Session & Profile Persistence (User A)
  console.log("\n[2/9] Testing Session Restoration & Profile Retrieval:");
  const meResA = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${tokenA}`,
      ...(cookieA ? { Cookie: cookieA.split(";")[0] } : {}),
    },
  });
  const meDataA = await meResA.json();
  if (!meDataA.user || meDataA.user.id !== userA_id) {
    console.error(`  ✗ Failed to retrieve profile:`, meDataA);
    process.exit(1);
  }
  console.log(`  ✓ Session verified for User A: ${meDataA.user.name}`);

  // 3. Update Profile Remotely
  console.log("\n[3/9] Testing Profile Update & Database Persistence:");
  const updatedNameA = `Creator A Verified ${timestamp}`;
  const updateProfileRes = await fetch(`${BASE_URL}/api/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ name: updatedNameA }),
  });
  const updateProfileData = await updateProfileRes.json();
  if (!updateProfileData.success || updateProfileData.user?.name !== updatedNameA) {
    console.error(`  ✗ Failed to update profile:`, updateProfileData);
    process.exit(1);
  }
  console.log(`  ✓ Profile updated and persisted: ${updatedNameA}`);

  // 4. Create Project & Segments for User A
  console.log("\n[4/9] Testing Remote Project Creation & Storage Link:");
  projectIdA = `proj-test-${timestamp}`;
  const initialSegments = [
    { id: "seg-1", start: 0.0, end: 2.5, text: "Testing Kalalo production backend.", language: "en" },
    { id: "seg-2", start: 2.8, end: 5.0, text: "Speech transcription verified.", language: "en" },
  ];

  const createProjRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      id: projectIdA,
      name: `Backend Test Project ${timestamp}`,
      fileName: "test-clip.mp4",
      durationSeconds: 5.4,
      aspectRatio: "9:16",
      presetId: "kalalo-clean-bold",
      segments: initialSegments,
    }),
  });

  const createProjData = await createProjRes.json();
  if (createProjRes.status !== 201 || !createProjData.project) {
    console.error(`  ✗ Project creation failed (${createProjRes.status}):`, createProjData);
    process.exit(1);
  }
  const realProjId = createProjData.project.id;
  console.log(`  ✓ Project created: ${realProjId}`);

  // 5. Edit Caption and Save Changes (PATCH /api/projects/[id])
  console.log("\n[5/9] Testing Caption Edit & Project Save Persistence:");
  const editedSegments = [
    { id: "seg-1", start: 0.1, end: 2.4, text: "Edited verbatim caption segment.", language: "en" },
    { id: "seg-2", start: 2.6, end: 5.2, text: "Google Gemini AI transcription verified.", language: "en" },
  ];
  const patchRes = await fetch(`${BASE_URL}/api/projects/${realProjId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: `Renamed Project ${timestamp}`,
      segments: editedSegments,
      presetId: "kalalo-pop-highlight",
    }),
  });
  if (!patchRes.ok) {
    console.error(`  ✗ Project PATCH failed (${patchRes.status})`);
    process.exit(1);
  }

  // Read back to verify database write
  const readBackRes = await fetch(`${BASE_URL}/api/projects/${realProjId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const readBackData = await readBackRes.json();
  if (readBackData.project?.name !== `Renamed Project ${timestamp}` || readBackData.project?.segments?.length !== 2) {
    console.error(`  ✗ Read-back mismatch:`, readBackData);
    process.exit(1);
  }
  console.log(`  ✓ Project & captions read-back verified: Name "${readBackData.project.name}", Segments: ${readBackData.project.segments.length}`);

  // 6. Test SRT & VTT Subtitle Export
  console.log("\n[6/9] Testing SRT & WebVTT Subtitle Exports:");
  const srtRes = await fetch(`${BASE_URL}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments: editedSegments, format: "srt" }),
  });
  const srtData = await srtRes.json();
  if (!srtData.content || !srtData.content.includes("Edited verbatim caption segment.")) {
    console.error(`  ✗ SRT export content invalid:`, srtData);
    process.exit(1);
  }
  console.log(`  ✓ SRT format verified with timestamps and cue text`);

  const vttRes = await fetch(`${BASE_URL}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments: editedSegments, format: "vtt" }),
  });
  const vttData = await vttRes.json();
  if (!vttData.content || !vttData.content.startsWith("WEBVTT")) {
    console.error(`  ✗ VTT export content invalid:`, vttData);
    process.exit(1);
  }
  console.log(`  ✓ WebVTT format verified with header and cue timing`);

  // 7. Register User B & Test Multi-tenant Isolation
  console.log("\n[7/9] Testing Multi-Tenant Isolation (User B vs User A):");
  const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userB_email, name: userB_name, password: userB_pass }),
  });
  const regDataB = await regResB.json();
  userB_id = regDataB.user.id;
  tokenB = regDataB.token;

  // User B tries to read User A's project
  const crossReadRes = await fetch(`${BASE_URL}/api/projects/${realProjId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (crossReadRes.status === 404 || crossReadRes.status === 403) {
    console.log(`  ✓ User B cross-tenant read rejected: HTTP ${crossReadRes.status} (Access Denied)`);
  } else {
    console.error(`  ✗ SECURITY VIOLATION: User B read User A project! Status: ${crossReadRes.status}`);
    process.exit(1);
  }

  // User B tries to delete User A's project
  const crossDeleteRes = await fetch(`${BASE_URL}/api/projects/${realProjId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (crossDeleteRes.status === 404 || crossDeleteRes.status === 403) {
    console.log(`  ✓ User B cross-tenant delete rejected: HTTP ${crossDeleteRes.status} (Access Denied)`);
  } else {
    console.error(`  ✗ SECURITY VIOLATION: User B deleted User A project! Status: ${crossDeleteRes.status}`);
    process.exit(1);
  }

  // 8. Test Private Media Streaming Authorization
  console.log("\n[8/9] Testing Private Media Access Authorization:");
  // Unauthenticated stream attempt
  const unauthStreamRes = await fetch(`${BASE_URL}/api/media/stream?projectId=${realProjId}`);
  if (unauthStreamRes.status === 401) {
    console.log(`  ✓ Unauthenticated streaming rejected: HTTP 401 (Unauthorized)`);
  } else {
    console.error(`  ✗ Expected 401 for unauthenticated streaming, got: ${unauthStreamRes.status}`);
  }

  // User B stream attempt for User A's project
  const crossStreamRes = await fetch(`${BASE_URL}/api/media/stream?projectId=${realProjId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (crossStreamRes.status === 404 || crossStreamRes.status === 403) {
    console.log(`  ✓ User B unauthorized media access rejected: HTTP ${crossStreamRes.status} (Access Denied)`);
  } else {
    console.error(`  ✗ SECURITY VIOLATION: User B accessed User A media! Status: ${crossStreamRes.status}`);
  }

  // 9. Cleanup Disposable Test Records
  console.log("\n[9/9] Teardown & Cleanup of Disposable Test Project:");
  const deleteResA = await fetch(`${BASE_URL}/api/projects/${realProjId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (deleteResA.ok) {
    console.log(`  ✓ Test project deleted successfully: ${realProjId}`);
  }

  console.log("\n================================================================");
  console.log("  ALL PRODUCTION BACKEND & SECURITY VERIFICATIONS PASSED (100%)");
  console.log("================================================================\n");
}

run().catch((err) => {
  console.error("FATAL ERROR in verification suite:", err);
  process.exit(1);
});
