/**
 * Checks on the shared sources themselves (`pnpm sync --check` covers the outputs).
 *
 * - Every platform folder has exactly the fragments the protocol uses.
 * - Every platform renders: no placeholder is left and no fragment is missing.
 * - The coder.json template parses.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { renderProtocol } from "../../../scripts/sync.mjs";

const core = fileURLToPath(new URL("..", import.meta.url));
const protocol = readFileSync(`${core}protocol/protocol.md`, "utf8");
const used = [
  ...new Set([...protocol.matchAll(/\{\{([a-z-]+)\}\}/g)].map((m) => m[1])),
]
  .filter((name) => name !== "usage")
  .sort();
const extras = new Set(["skill-header.md"]);
const platforms = readdirSync(`${core}platforms`);

test("at least one platform exists", () => {
  assert.ok(platforms.length >= 2);
});

for (const platform of platforms) {
  test(`${platform}: fragments match the protocol's placeholders`, () => {
    const fragments = readdirSync(`${core}platforms/${platform}`)
      .filter((file) => !extras.has(file))
      .map((file) => file.replace(/\.md$/, ""))
      .sort();
    assert.deepEqual(fragments, used);
  });

  test(`${platform}: renders with no placeholder left`, () => {
    assert.doesNotMatch(renderProtocol(platform), /\{\{[a-z-]+\}\}/);
  });
}

test("the coder.json template parses", () => {
  JSON.parse(readFileSync(`${core}config/coder.example.json`, "utf8"));
});
