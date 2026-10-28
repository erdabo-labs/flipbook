import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import manifest from "../app/manifest";

function worker(fetchResult: () => Promise<unknown>) {
  const handlers = new Map<string, (event: Record<string, unknown>) => void>();
  const fallback = { offline: true };
  const matched: string[] = [];
  runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
    self: { location: { origin: "https://flipbook.test" }, addEventListener: (type: string, handler: (event: Record<string, unknown>) => void) => handlers.set(type, handler) },
    URL,
    fetch: fetchResult,
    caches: { match: async (path: string) => { matched.push(path); return fallback; } },
  });
  return { handlers, fallback, matched };
}

test("offline worker leaves API requests, mutations, and external pages alone", () => {
  const { handlers } = worker(async () => { throw new Error("must not fetch"); });
  for (const request of [
    { method: "POST", mode: "cors", url: "https://flipbook.test/api/data/createSaleOrBundleTransaction" },
    { method: "GET", mode: "cors", url: "https://flipbook.test/api/health" },
    { method: "GET", mode: "navigate", url: "https://other.test/" },
  ]) {
    let intercepted = false;
    handlers.get("fetch")!({ request, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false);
  }
});

test("failed page navigation uses only the generic offline fallback", async () => {
  const { handlers, fallback, matched } = worker(async () => { throw new Error("offline"); });
  let response: Promise<unknown> | undefined;
  handlers.get("fetch")!({ request: { method: "GET", mode: "navigate", url: "https://flipbook.test/acquisitions/1" }, respondWith: (value: Promise<unknown>) => { response = value; } });
  assert.equal(await response, fallback);
  assert.deepEqual(matched, ["/offline.html"]);
});

test("online page navigation preserves the network response", async () => {
  const network = { online: true };
  const { handlers, matched } = worker(async () => network);
  let response: Promise<unknown> | undefined;
  handlers.get("fetch")!({ request: { method: "GET", mode: "navigate", url: "https://flipbook.test/inventory" }, respondWith: (value: Promise<unknown>) => { response = value; } });
  assert.equal(await response, network);
  assert.deepEqual(matched, []);
});

test("PWA installs without locking orientation or requesting a public origin", () => {
  const config = manifest();
  assert.equal(config.display, "standalone");
  assert.equal(config.start_url, "/");
  assert.equal(config.scope, "/");
  assert.equal(config.orientation, undefined);
  assert.ok(config.icons?.length);
});
