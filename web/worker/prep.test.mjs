// node --test worker/  — paid-prep endpoints, with Polar and KV mocked.
import test from "node:test";
import assert from "node:assert/strict";
import worker, { sign, verify } from "./index.js";

const GOOD = "OH-GOOD-KEY";
const env = {
  PREP: { get: async (k) => (k === "bank:v1" ? JSON.stringify([{ id: "p-1" }]) : null) },
  PREP_SIGNING_KEY: "test-secret",
  POLAR_ORG_ID: "org",
  PREP_CHECKOUT_URL: "https://buy.polar.sh/x",
  ASSETS: { fetch: async () => new Response("asset") },
};
globalThis.fetch = async (_url, init) => {
  const { key, organization_id } = JSON.parse(init.body);
  if (key === GOOD && organization_id === "org")
    return new Response(JSON.stringify({ id: "lic-1", status: "granted", expires_at: null }), { status: 200 });
  return new Response("{}", { status: 404 });
};
const call = (path, init) => worker.fetch(new Request("https://x" + path, init), env, { waitUntil() {} });
const unlock = (key) =>
  call("/api/prep/unlock", { method: "POST", body: JSON.stringify({ key }), headers: { "content-type": "application/json" } });

test("config reports enabled only when fully configured", async () => {
  assert.deepEqual(await (await call("/api/prep/config")).json(), { enabled: true, checkoutUrl: "https://buy.polar.sh/x", price: null });
  const r = await worker.fetch(new Request("https://x/api/prep/config"), { ...env, PREP: undefined }, {});
  assert.deepEqual(await r.json(), { enabled: false, checkoutUrl: null, price: null });
});

test("a granted key unlocks the bank, a bad one does not", async () => {
  assert.equal((await unlock("nope")).status, 403);
  const { token } = await (await unlock(GOOD)).json();
  const bank = await call("/api/prep/bank", { headers: { authorization: `Bearer ${token}` } });
  assert.equal(bank.status, 200);
  assert.deepEqual(await bank.json(), [{ id: "p-1" }]);
});

test("bank refuses missing, forged and expired tokens", async () => {
  assert.equal((await call("/api/prep/bank")).status, 401);
  const forged = await sign({ sub: "x", exp: Date.now() + 1e6 }, "other-secret");
  assert.equal((await call("/api/prep/bank", { headers: { authorization: `Bearer ${forged}` } })).status, 401);
  const old = await sign({ sub: "x", exp: Date.now() - 1 }, env.PREP_SIGNING_KEY);
  assert.equal((await call("/api/prep/bank", { headers: { authorization: `Bearer ${old}` } })).status, 401);
  assert.equal(await verify("garbage", "k"), null);
});
