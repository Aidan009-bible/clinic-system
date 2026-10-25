import { randomBytes } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const databaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !databaseKey) {
  console.error("Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to .env.local, then run npm run deploy again. Never paste the secret into chat or commit it.");
  process.exit(1);
}

const project = await readFile(".vercel/project.json", "utf8").then(JSON.parse).catch(() => {
  throw new Error("Link this directory first: vercel link --project clinic-mkkt");
});

const supabase = createClient(url, databaseKey, { auth: { persistSession: false } });
const { error } = await supabase.from("clinic_state").select("id, revision").limit(1);
if (error) {
  console.error(`Supabase preflight failed: ${error.message}. Run supabase/schema.sql in the SQL Editor before deploying.`);
  process.exit(1);
}
console.log("Supabase connection and schema verified.");

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  sessionSecret = randomBytes(48).toString("hex");
  await appendFile(".env.local", `\nSESSION_SECRET=${sessionSecret}\n`, { mode: 0o600 });
  console.log("Generated a session signing secret in ignored .env.local.");
}

function runVercel(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn("vercel", args, { stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Vercel exited with code ${code}.`)));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

const variables = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SECRET_KEY: databaseKey,
  SESSION_SECRET: sessionSecret,
}).map(([key, value]) => ({ key, value, type: "encrypted", target: ["production", "preview"] }));

// Send secrets through stdin and suppress the API response, which can contain values.
await runVercel([
  "api", `/v10/projects/${project.projectId}/env?upsert=true&teamId=${project.orgId}`,
  "--method", "POST", "--input", "-", "--silent",
], JSON.stringify(variables));
console.log("Production and Preview environment variables configured.");

await runVercel(["deploy", "--prod", "--yes"]);
