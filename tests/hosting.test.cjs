/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS test harness. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

function loadSource(file, mocks = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  const localRequire = (name) => name in mocks ? mocks[name] : require(name);
  new Function("require", "exports", source)(localRequire, exports);
  return exports;
}

function createClinic(snapshot) {
  let row = { id: "default", snapshot: structuredClone(snapshot), revision: 0 };
  const client = {
    from() {
      const filters = {};
      let update;
      return {
        select() { return this; },
        eq(key, value) { filters[key] = value; return this; },
        update(value) { update = value; return this; },
        async maybeSingle() {
          if (update) {
            if (row.revision !== filters.revision) return { data: null, error: null };
            row = structuredClone({ ...row, ...update });
            return { data: { id: row.id }, error: null };
          }
          return { data: structuredClone(row), error: null };
        },
      };
    },
  };
  const clinic = loadSource("src/lib/clinic-server.ts", {
    "@/lib/demo-data": { demoClinicSnapshot: snapshot },
    "@/lib/supabase-server": { getSupabaseServerClient: () => client },
  });
  return { clinic, state: () => row.snapshot };
}

const { demoClinicSnapshot } = loadSource("src/lib/demo-data.ts");

test("session signatures reject changed roles and unsigned cookies", () => {
  process.env.SESSION_SECRET = "test-secret-with-more-than-thirty-two-characters";
  const auth = loadSource("src/lib/auth.ts", { "next/headers": {}, "next/navigation": {} });
  const session = { username: "reception", role: "reception" };
  const token = auth.encodeSession(session);
  assert.deepEqual(auth.decodeSession(token), session);
  const [payload, signature] = token.split(".");
  const forged = JSON.parse(Buffer.from(payload, "base64url"));
  forged.role = "admin";
  assert.equal(auth.decodeSession(Buffer.from(JSON.stringify(forged)).toString("base64url") + "." + signature), null);
  assert.equal(auth.decodeSession(Buffer.from(JSON.stringify(session)).toString("base64url")), null);
  const now = Date.now;
  try {
    Date.now = () => now() + 13 * 60 * 60 * 1000;
    assert.equal(auth.decodeSession(token), null);
  } finally { Date.now = now; }
});

test("empty database collections stay empty instead of restoring demo records", async () => {
  const { clinic } = createClinic({ ...demoClinicSnapshot, patients: [], medicines: [], visits: [] });
  const snapshot = await clinic.getClinicSnapshot();
  assert.deepEqual(snapshot.patients, []);
  assert.deepEqual(snapshot.medicines, []);
  assert.deepEqual(snapshot.visits, []);
});

test("simultaneous saves reject stale data instead of overwriting another staff update", async () => {
  const { clinic, state } = createClinic(demoClinicSnapshot);
  const results = await Promise.allSettled([
    clinic.createPatient({ name: "Test A", age: 20, phone: "1", tags: [] }),
    clinic.createPatient({ name: "Test B", age: 21, phone: "2", tags: [] }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.match(results.find((result) => result.status === "rejected").reason.message, /Another staff member/);
  assert.equal(state().patients.length, demoClinicSnapshot.patients.length + 1);
});

test("issuing the same bill twice deducts stock once", async () => {
  const snapshot = structuredClone(demoClinicSnapshot);
  const visit = snapshot.visits.find((entry) => entry.status === "Ready for Billing");
  assert.ok(visit);
  const { clinic, state } = createClinic(snapshot);
  await clinic.issueBillAndReduceStock(visit.id);
  const stockAfterFirstBill = structuredClone(state().medicines);
  await clinic.issueBillAndReduceStock(visit.id);
  assert.deepEqual(state().medicines, stockAfterFirstBill);
});

test("reception cannot delete a completed visit", async () => {
  const { clinic } = createClinic(demoClinicSnapshot);
  const visit = demoClinicSnapshot.visits.find((entry) => entry.status === "Completed");
  await assert.rejects(clinic.deleteQueuedVisit(visit.id), /Only an active queue visit/);
});
