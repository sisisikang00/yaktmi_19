import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Test-only transport and runtime. Synthetic records never enter app code or public assets.
const realRequire = createRequire(import.meta.url);
function harness(transport) {
  const source = readFileSync(new URL("../lib/api/mfds.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exported = {};
  const env = {};
  const sandbox = { exports: exported, process: { env }, URL, AbortSignal, Buffer, require: (name) => name === "server-only" ? {} : name === "node:https" ? { get: transport ?? (() => { throw new Error("Unexpected network access"); }) } : realRequire(name) };
  vm.runInNewContext(compiled, sandbox, { filename: "mfds-test-runtime.cjs" });
  return { api: exported, env };
}
const normal = (items = [], total = items.length) => ({ header: { resultCode: "00" }, body: { items, totalCount: total } });

test("official JSON array and Swagger wrapper formats normalize", () => {
  const { api } = harness();
  assert.equal(api.parseEnvelope(normal([{ ITEM_SEQ: "TEST-ONLY" }])).items.length, 1);
  assert.equal(api.parseEnvelope({ response: normal({ item: { ITEM_SEQ: "TEST-ONLY" } }, "1") }).items.length, 1);
  assert.equal(api.parseEnvelope(normal(null, 0)).items.length, 0);
  assert.equal(api.parseEnvelope(normal("", 0)).total, 0);
});
test("upstream rejection never echoes secret result messages", () => {
  const { api } = harness();
  assert.throws(() => api.parseEnvelope({ header: { resultCode: "30", resultMsg: "TEST_SECRET" } }), (e) => e.code === "MFDS_REJECTED" && !e.message.includes("TEST_SECRET"));
});
test("malformed payloads fail closed", () => {
  const { api } = harness();
  for (const payload of [null, {}, normal(null, 2), normal(["wrong"], 1), normal([], "not-a-number")]) assert.throws(() => api.parseEnvelope(payload));
});
test("key absence returns clear 503 without performing a request", async () => {
  const { api } = harness();
  await assert.rejects(api.requestMfds("https://example.invalid", "ServiceKey", {}), (e) => e.status === 503 && e.code === "MFDS_NOT_CONFIGURED");
});
test("only documented URL parameters are sent; encoded keys are encoded once", async () => {
  let captured;
  const { api, env } = harness((url, _options, callback) => {
    captured = url;
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = new EventEmitter(); response.statusCode = 200;
      callback(response); response.emit("data", Buffer.from(JSON.stringify(normal([], 0)))); response.emit("end");
    });
    return request;
  });
  env.MFDS_SERVICE_KEY = "TEST%2BKEY%2F%3D";
  const result = await api.requestMfds("https://example.invalid/operation", "ServiceKey", { pageNo: 2, itemName: "TEST ONLY", unused: "" });
  assert.equal(result.total, 0);
  assert.equal(captured.searchParams.get("ServiceKey"), "TEST+KEY/=");
  assert.equal(captured.searchParams.get("type"), "json");
  assert.equal(captured.searchParams.has("unused"), false);
});

test("all three API modules share the single server service key", async () => {
  const requests = [];
  const { api, env } = harness((url, _options, callback) => {
    requests.push(url);
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = new EventEmitter(); response.statusCode = 200;
      callback(response); response.emit("data", Buffer.from(JSON.stringify(normal([], 0)))); response.emit("end");
    });
    return request;
  });
  env.MFDS_SERVICE_KEY = "TEST_ONLY_SHARED_KEY";
  for (const [file, method, args] of [["easy-drug", "searchEasy", ["TEST"]], ["permit", "searchPermits", ["TEST"]], ["identification", "getIdentification", [{ name: "TEST", page: 1, pageSize: 12 }]]]) {
    const source = readFileSync(new URL(`../lib/api/${file}.ts`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    const exported = {};
    vm.runInNewContext(compiled, { exports: exported, require: (name) => name === "server-only" ? {} : name === "./mfds" ? api : realRequire(name) });
    await exported[method](...args);
  }
  assert.equal(requests.length, 3);
  assert.equal(requests[0].searchParams.get("ServiceKey"), env.MFDS_SERVICE_KEY);
  for (const url of requests.slice(1)) assert.equal(url.searchParams.get("serviceKey"), env.MFDS_SERVICE_KEY);
});
test("transport failures and invalid JSON never expose URL/key", async () => {
  const { api, env } = harness(() => { throw new Error("https://example.invalid?ServiceKey=TEST_SECRET"); }); env.MFDS_SERVICE_KEY = "TEST_SECRET";
  await assert.rejects(api.requestMfds("https://example.invalid", "serviceKey", {}), (e) => !e.message.includes("TEST_SECRET") && !e.message.includes("example.invalid"));
});
test("input validation rejects malformed pagination and identifiers", () => {
  const { api } = harness();
  for (const value of ["0", "-1", "1.5", "Infinity", "100000", "1x"]) assert.throws(() => api.pageNumber(value));
  assert.equal(api.pageNumber(null), 1); assert.equal(api.pageNumber("2"), 2);
  assert.throws(() => api.itemCode("../secret")); assert.equal(api.itemCode("123456789"), "123456789");
  assert.throws(() => api.queryText("a".repeat(101), "name")); assert.throws(() => api.queryText("a\nb", "name"));
});
test("text is rendered as plain content and images accept only HTTP(S)", () => {
  const { api } = harness();
  assert.equal(api.plainText("<p>TEST</p><p>ONLY &amp; SAFE</p>"), "TEST\nONLY & SAFE");
  assert.equal(api.imageUrl("javascript:alert(1)"), undefined);
  assert.equal(api.imageUrl("https://user:pass@example.invalid/a.png"), undefined);
  assert.equal(api.imageUrl("http://example.invalid/a.png"), "https://example.invalid/a.png");
});
