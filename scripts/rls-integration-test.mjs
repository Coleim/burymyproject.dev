/**
 * RLS integration test — runs against the real Supabase project.
 *
 * Uses the service_role key only to create/delete fully-confirmed test
 * users (bypassing the mailer entirely, no rate limit issues). All actual
 * assertions use anon-key clients signed in as those users, exactly like
 * a real browser would — so this genuinely exercises the RLS policies.
 *
 * Required env vars:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY (anon key)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Exits with a non-zero code if any assertion fails.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error(
    "Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY, SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

let failures = 0;

function check(label, ok, extra = "") {
  if (ok) {
    console.log(`✅ ${label}`);
  } else {
    failures += 1;
    console.error(`❌ ${label}${extra ? " — " + extra : ""}`);
  }
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const emailA = `rls-test-a-${suffix}@example.com`;
const emailB = `rls-test-b-${suffix}@example.com`;
const password = "RlsTest1234!";

let userAId;
let userBId;
let publicGraveId;
let privateGraveId;

try {
  // --- Create two fully-confirmed test users via the admin API ---
  const { data: createdA, error: createAError } =
    await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });
  check("Create confirmed test user A", !createAError, createAError?.message);
  userAId = createdA?.user?.id;

  const { data: createdB, error: createBError } =
    await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    });
  check("Create confirmed test user B", !createBError, createBError?.message);
  userBId = createdB?.user?.id;

  // --- Sign in as each user with the anon key, like a real client would ---
  const clientA = createClient(url, anonKey);
  const clientB = createClient(url, anonKey);
  const anonClient = createClient(url, anonKey);

  const { error: loginAError } = await clientA.auth.signInWithPassword({
    email: emailA,
    password,
  });
  check("Login user A", !loginAError, loginAError?.message);

  const { error: loginBError } = await clientB.auth.signInWithPassword({
    email: emailB,
    password,
  });
  check("Login user B", !loginBError, loginBError?.message);

  // --- User A creates a public grave and a private grave ---
  const { data: publicGrave, error: publicGraveError } = await clientA
    .from("graves")
    .insert({
      author_id: userAId,
      name: "RLS Integration Test — Public",
      epitaph: "It lived fast, it died in production.",
      born: "2024-01-01",
      died: "2024-02-01",
      cause: "Automated Testing",
      tech_stack: ["React"],
      is_public: true,
      tombstone_bg: "grave_bg_01.webp",
      tombstone_fg: "grave_01.webp",
    })
    .select("*")
    .single();
  check(
    "User A creates a PUBLIC grave",
    !publicGraveError && !!publicGrave,
    publicGraveError?.message,
  );
  publicGraveId = publicGrave?.id;

  const { data: privateGrave, error: privateGraveError } = await clientA
    .from("graves")
    .insert({
      author_id: userAId,
      name: "RLS Integration Test — Private",
      epitaph: "Shh, nobody should see this.",
      born: "2024-01-01",
      died: "2024-02-01",
      cause: "Secrecy",
      tech_stack: [],
      is_public: false,
      tombstone_bg: "grave_bg_01.webp",
      tombstone_fg: "grave_01.webp",
    })
    .select("*")
    .single();
  check(
    "User A creates a PRIVATE grave",
    !privateGraveError && !!privateGrave,
    privateGraveError?.message,
  );
  privateGraveId = privateGrave?.id;

  if (publicGrave && privateGrave) {
    // --- Anonymous visitor ---
    const { data: anonReadsPublic } = await anonClient
      .from("graves")
      .select("*")
      .eq("public_slug", publicGrave.public_slug)
      .maybeSingle();
    check("Anonymous visitor CAN read the PUBLIC grave", !!anonReadsPublic);

    const { data: anonReadsPrivate } = await anonClient
      .from("graves")
      .select("*")
      .eq("public_slug", privateGrave.public_slug)
      .maybeSingle();
    check(
      "Anonymous visitor CANNOT read the PRIVATE grave",
      anonReadsPrivate === null,
    );

    // --- User B (different author) ---
    const { data: bReadsPrivate } = await clientB
      .from("graves")
      .select("*")
      .eq("public_slug", privateGrave.public_slug)
      .maybeSingle();
    check(
      "User B CANNOT read user A's PRIVATE grave",
      bReadsPrivate === null,
    );

    const { error: deleteError, count: deleteCount } = await clientB
      .from("graves")
      .delete({ count: "exact" })
      .eq("id", publicGrave.id);
    check(
      "User B CANNOT delete user A's grave (RLS)",
      !deleteError && deleteCount === 0,
      deleteError?.message ?? `rows deleted: ${deleteCount}`,
    );

    const { data: updateResult, error: updateError } = await clientB
      .from("graves")
      .update({ name: "HACKED" })
      .eq("id", publicGrave.id)
      .select("*");
    check(
      "User B CANNOT update user A's grave (RLS)",
      !updateError && (updateResult?.length ?? 0) === 0,
      updateError?.message ?? `rows updated: ${updateResult?.length}`,
    );
  }
} finally {
  // --- Cleanup: always runs, even if an assertion threw ---
  if (publicGraveId) await admin.from("graves").delete().eq("id", publicGraveId);
  if (privateGraveId)
    await admin.from("graves").delete().eq("id", privateGraveId);
  if (userAId) await admin.auth.admin.deleteUser(userAId);
  if (userBId) await admin.auth.admin.deleteUser(userBId);
  console.log("🧹 Cleanup done (test users + graves removed)");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}

console.log("\nAll RLS integration checks passed.");
