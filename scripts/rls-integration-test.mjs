/**
 * RLS integration test — runs against the real Supabase project.
 *
 * Uses the service_role key only to create/delete fully-confirmed test
 * users and to mint a one-time sign-in token for them (bypassing the mailer
 * entirely, no rate limit issues). Email/password sign-in is disabled on the
 * project (OAuth-only), so the users cannot log in with a password; the
 * token is exchanged through the anon key like any client would. All actual
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

let userAId;
let userBId;
let publicGraveId;

try {
  // --- Create two fully-confirmed test users via the admin API ---
  const { data: createdA, error: createAError } =
    await admin.auth.admin.createUser({
      email: emailA,
      email_confirm: true,
    });
  check("Create confirmed test user A", !createAError, createAError?.message);
  userAId = createdA?.user?.id;

  const { data: createdB, error: createBError } =
    await admin.auth.admin.createUser({
      email: emailB,
      email_confirm: true,
    });
  check("Create confirmed test user B", !createBError, createBError?.message);
  userBId = createdB?.user?.id;

  // --- Sign in as each user with the anon key, like a real client would ---
  // No password: mint a one-time token with the admin API and exchange it.
  async function signInAs(email) {
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError) return { client, error: linkError };
    const { error } = await client.auth.verifyOtp({
      token_hash: link.properties.hashed_token,
      type: "magiclink",
    });
    return { client, error };
  }

  const anonClient = createClient(url, anonKey);
  const { client: clientA, error: loginAError } = await signInAs(emailA);
  check("Sign in as user A (one-time token)", !loginAError, loginAError?.message);

  const { client: clientB, error: loginBError } = await signInAs(emailB);
  check("Sign in as user B (one-time token)", !loginBError, loginBError?.message);

  // --- Email/password is OAuth-only: it must stay refused server-side ---
  const strayEmail = `rls-disabled-check-${suffix}@example.com`;
  const { data: strayUser, error: signUpError } = await anonClient.auth.signUp({
    email: strayEmail,
    password: "Sup3rSecret-pass",
  });
  check(
    "Email/password SIGNUP is disabled (OAuth-only)",
    signUpError?.code === "email_provider_disabled",
    signUpError ? `${signUpError.code}: ${signUpError.message}` : "signup was accepted",
  );
  if (strayUser?.user?.id) await admin.auth.admin.deleteUser(strayUser.user.id);

  const { error: passwordLoginError } =
    await anonClient.auth.signInWithPassword({
      email: emailA,
      password: "Sup3rSecret-pass",
    });
  check(
    "Email/password LOGIN is disabled (OAuth-only)",
    passwordLoginError?.code === "email_provider_disabled",
    passwordLoginError
      ? `${passwordLoginError.code}: ${passwordLoginError.message}`
      : "login was accepted",
  );

  // --- User A creates a grave (every grave is public) ---
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
      tombstone_bg: "grave_bg_01.webp",
      tombstone_fg: "grave_01.webp",
      founding_rank: 3, // a client must not be able to claim a Founding Ghost rank
    })
    .select("*")
    .single();
  check(
    "User A creates a grave",
    !publicGraveError && !!publicGrave,
    publicGraveError?.message,
  );
  publicGraveId = publicGrave?.id;

  // --- Private graves no longer exist ---
  const { error: privateAttemptError } = await clientA.from("graves").insert({
    author_id: userAId,
    name: "RLS Integration Test — Private attempt",
    epitaph: "Shh, nobody should see this.",
    born: "2024-01-01",
    died: "2024-02-01",
    cause: "Secrecy",
    tech_stack: [],
    is_public: false,
    tombstone_bg: "grave_bg_01.webp",
    tombstone_fg: "grave_01.webp",
  });
  check("A private grave CANNOT be created", !!privateAttemptError);

  // --- Founding Ghosts: only the database can award a rank ---
  check(
    "A client CANNOT set its own Founding Ghost rank (and test accounts never claim one)",
    publicGrave?.founding_rank === null,
    `founding_rank: ${publicGrave?.founding_rank}`,
  );
  for (const [who, client] of [["Anonymous visitor", anonClient], ["Signed-in user", clientA]]) {
    const { error: ledgerError } = await client.from("founding_ghosts").select("*");
    check(`${who} CANNOT read the founding_ghosts ledger`, !!ledgerError);
  }

  if (publicGrave) {
    // --- Anonymous visitor ---
    const { data: anonReadsPublic } = await anonClient
      .from("graves")
      .select("*")
      .eq("public_slug", publicGrave.public_slug)
      .maybeSingle();
    check("Anonymous visitor CAN read the grave", !!anonReadsPublic);

    // --- User B (different author) ---
    const { data: bReadsPublic } = await clientB
      .from("graves")
      .select("*")
      .eq("public_slug", publicGrave.public_slug)
      .maybeSingle();
    check("User B CAN read user A's grave", !!bReadsPublic);

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

    // --- Author editing (Edit grave feature) ---
    const { data: ownUpdate, error: ownUpdateError } = await clientA
      .from("graves")
      .update({ epitaph: "Edited by its author." })
      .eq("id", publicGrave.id)
      .select("*");
    check(
      "User A CAN update their own grave",
      !ownUpdateError && ownUpdate?.[0]?.epitaph === "Edited by its author.",
      ownUpdateError?.message,
    );

    const { data: reassign } = await clientA
      .from("graves")
      .update({ author_id: userBId })
      .eq("id", publicGrave.id)
      .select("*");
    check(
      "User A CANNOT hand their grave over to another author_id (RLS with check)",
      (reassign?.length ?? 0) === 0,
      `rows updated: ${reassign?.length}`,
    );

    // --- Hardening (migration 20261020150000_harden_graves) ---
    const { data: forged } = await clientA
      .from("graves")
      .insert({
        author_id: userAId,
        name: "RLS Integration Test — Forged date",
        epitaph: "Trying to stay on top forever.",
        born: "2024-01-01",
        died: "2024-02-01",
        cause: "Cheating",
        tech_stack: [],
        tombstone_bg: "grave_bg_01.webp",
        tombstone_fg: "grave_01.webp",
        created_at: "2099-01-01T00:00:00Z",
      })
      .select("*")
      .single();
    check(
      "created_at is server-controlled on insert (2099 is ignored)",
      !!forged && new Date(forged.created_at).getFullYear() < 2090,
      `created_at: ${forged?.created_at}`,
    );

    const { data: tampered } = await clientA
      .from("graves")
      .update({
        created_at: "2099-01-01T00:00:00Z",
        public_slug: "hijacked-slug",
        tombstone_bg: "evil.webp",
      })
      .eq("id", publicGrave.id)
      .select("*");
    check(
      "created_at, public_slug and tombstone cannot be changed on update",
      tampered?.[0]?.created_at === publicGrave.created_at &&
        tampered?.[0]?.public_slug === publicGrave.public_slug &&
        tampered?.[0]?.tombstone_bg === publicGrave.tombstone_bg,
    );

    const { error: tooLongError } = await clientA
      .from("graves")
      .update({ description: "x".repeat(1001) })
      .eq("id", publicGrave.id);
    check(
      "A 1001-character description is rejected by the database",
      !!tooLongError,
    );

    const { error: badUrlError } = await clientA
      .from("graves")
      .update({ project_url: "javascript:alert(1)" })
      .eq("id", publicGrave.id);
    check("A javascript: project_url is rejected by the database", !!badUrlError);

    const { error: anonInsertError } = await anonClient.from("graves").insert({
      author_id: userAId,
      name: "Anonymous insert",
      tombstone_bg: "grave_bg_01.webp",
      tombstone_fg: "grave_01.webp",
    });
    check("Anonymous visitor CANNOT insert a grave", !!anonInsertError);

    // --- home_stats(): aggregates only, consistent with what anon can see ---
    const { data: stats, error: statsError } = await anonClient
      .rpc("home_stats")
      .single();
    const { count: visibleCount } = await anonClient
      .from("graves")
      .select("*", { count: "exact", head: true });
    check(
      "Anonymous visitor can call home_stats() and its total matches the graves anyone can see",
      !statsError && !!stats && stats.total_graves === visibleCount,
      statsError?.message ?? `stats=${stats?.total_graves} visible=${visibleCount}`,
    );

    // --- Moderation: `hidden` is admin-only and honoured by the public policy ---
    await admin.from("graves").update({ hidden: true }).eq("id", publicGrave.id);

    const { data: anonSeesHidden } = await anonClient
      .from("graves")
      .select("id")
      .eq("id", publicGrave.id);
    check(
      "A hidden grave disappears for anonymous visitors",
      (anonSeesHidden?.length ?? 1) === 0,
    );

    const { data: bSeesHidden } = await clientB
      .from("graves")
      .select("id")
      .eq("id", publicGrave.id);
    check(
      "A hidden grave disappears for other signed-in users",
      (bSeesHidden?.length ?? 1) === 0,
    );

    const { data: aSeesHidden } = await clientA
      .from("graves")
      .select("id, hidden")
      .eq("id", publicGrave.id);
    check(
      "The author still sees their own hidden grave",
      aSeesHidden?.length === 1 && aSeesHidden[0].hidden === true,
    );

    const { data: unhideAttempt } = await clientA
      .from("graves")
      .update({ hidden: false })
      .eq("id", publicGrave.id)
      .select("hidden");
    check(
      "The author CANNOT unhide a moderated grave",
      unhideAttempt?.[0]?.hidden === true,
      `hidden after attempt: ${unhideAttempt?.[0]?.hidden}`,
    );

    const { data: selfHidden } = await clientA
      .from("graves")
      .insert({
        author_id: userAId,
        name: "RLS Integration Test — Self-hidden",
        epitaph: "Trying to set the moderation flag.",
        born: "2024-01-01",
        died: "2024-02-01",
        cause: "Curiosity",
        tech_stack: [],
        hidden: true,
        tombstone_bg: "grave_bg_01.webp",
        tombstone_fg: "grave_01.webp",
      })
      .select("hidden")
      .single();
    check(
      "The `hidden` flag cannot be set by an author on insert",
      selfHidden?.hidden === false,
      `stored hidden: ${selfHidden?.hidden}`,
    );

    await admin.from("graves").update({ hidden: false }).eq("id", publicGrave.id);
  }
} finally {
  // --- Cleanup: always runs, even if an assertion threw ---
  if (publicGraveId) await admin.from("graves").delete().eq("id", publicGraveId);
  if (userAId) await admin.auth.admin.deleteUser(userAId);
  if (userBId) await admin.auth.admin.deleteUser(userBId);
  console.log("🧹 Cleanup done (test users + graves removed)");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}

console.log("\nAll RLS integration checks passed.");
