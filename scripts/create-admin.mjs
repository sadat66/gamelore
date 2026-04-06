/**
 * Creates or promotes a Supabase user to admin (profiles.is_admin = true).
 * Loads ../.env.local if present (does not override existing env vars).
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env:
 *   ADMIN_EMAIL    (default: admin@gamelore.local)
 *   ADMIN_PASSWORD (if unset, a random password is generated and printed once)
 */
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing required environment variables:");
  if (!url) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) {
    console.error("  - SUPABASE_SERVICE_ROLE_KEY");
    console.error(
      "    Add it to .env.local from Supabase → Project Settings → API → service_role (never expose to the client)."
    );
  }
  process.exit(1);
}

const email =
  (process.env.ADMIN_EMAIL || "admin@gamelore.local").trim().toLowerCase();

function randomPassword() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from(crypto.randomBytes(24), (b) => chars[b % chars.length]).join(
    ""
  );
}

const password = process.env.ADMIN_PASSWORD?.trim() || randomPassword();

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserIdByEmail(target) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const u = data.users.find(
      (x) => x.email?.toLowerCase() === target.toLowerCase()
    );
    if (u) return u.id;
    if (data.users.length < perPage) return null;
    page += 1;
    if (page > 50) return null;
  }
}

let userId;

const { data: created, error: createErr } = await supabase.auth.admin.createUser(
  {
    email,
    password,
    email_confirm: true,
  }
);

if (createErr) {
  const msg = createErr.message?.toLowerCase() ?? "";
  const exists =
    msg.includes("already") ||
    msg.includes("registered") ||
    msg.includes("exists") ||
    createErr.status === 422;

  if (!exists) {
    console.error("createUser failed:", createErr.message);
    process.exit(1);
  }

  userId = await findUserIdByEmail(email);
  if (!userId) {
    console.error("User may exist but could not be found by email:", email);
    process.exit(1);
  }

  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (updErr) {
    console.error("updateUserById failed:", updErr.message);
    process.exit(1);
  }
  console.log("Existing user updated with new password and email confirmed.");
} else {
  userId = created.user.id;
  console.log("New user created.");
}

const { error: profErr } = await supabase
  .from("profiles")
  .upsert({ id: userId, is_admin: true }, { onConflict: "id" });

if (profErr) {
  console.error("profiles upsert failed:", profErr.message);
  process.exit(1);
}

console.log("");
console.log("--- Admin credentials (save these; password is not stored in repo) ---");
console.log("Email (login id):", email);
console.log("Password:", password);
console.log("User UUID:", userId);
console.log("---");
console.log("Sign in at /login with the email and password above.");
