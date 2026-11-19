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
import { platforms as loadPlatforms } from "../../../scripts/lib/platforms.mjs";
import { appendInput, renderProtocol } from "../../../scripts/sync.mjs";

const core = fileURLToPath(new URL("..", import.meta.url));
const protocol = readFileSync(`${core}protocol/protocol.md`, "utf8");
const used = [
  ...new Set([...protocol.matchAll(/\{\{([a-z-]+)\}\}/g)].map((m) => m[1])),
]
  .filter((name) => name !== "usage")
  .sort();
const definitions = loadPlatforms();
const platforms = definitions.map((platform) => platform.id);

test("at least one platform exists", () => {
  assert.ok(platforms.length >= 2);
});

for (const platform of platforms) {
  test(`${platform}: fragments match the protocol's placeholders`, () => {
    const extras = new Set(
      [definitions.find((d) => d.id === platform)?.header].filter(Boolean),
    );
    const fragments = readdirSync(`${core}platforms/${platform}`)
      .filter((file) => file.endsWith(".md") && !extras.has(file))
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

test("every platform.json names a known format, an existing header and copy sources", () => {
  for (const platform of definitions) {
    assert.ok(
      ["skill-md", "toml-command", "js-module"].includes(platform.format),
      platform.id,
    );
    assert.ok(platform.name && platform.output, `${platform.id}: name, output`);
    if (platform.header) {
      readFileSync(
        `${core}platforms/${platform.id}/${platform.header}`,
        "utf8",
      );
    }
    if (platform.format === "toml-command") {
      assert.ok(
        platform.description,
        `${platform.id}: a TOML command needs a description`,
      );
    }
    if (platform.format !== "js-module") {
      assert.ok(platform.args, `${platform.id}: a file platform needs args`);
    }
    for (const { from } of platform.copies) {
      readFileSync(`${core}${from}`);
    }
  }
});

test("every platform's coder.example.json is byte-identical to core's", () => {
  const template = readFileSync(`${core}config/coder.example.json`);
  for (const platform of definitions) {
    for (const { from, to } of platform.copies) {
      if (from !== "config/coder.example.json") continue;
      const copy = readFileSync(`${core}../${platform.id}/${to}`);
      assert.ok(template.equals(copy), `${platform.id}: ${to}`);
    }
  }
});

test("a host placeholder such as {{args}} appears only in the appended input section", () => {
  for (const platform of platforms) {
    assert.ok(
      !renderProtocol(platform).includes("{{args}}"),
      `${platform}: the rendered protocol has no {{args}}`,
    );
  }
  const text = appendInput(renderProtocol("claude"), "{{args}}");
  const heading = text.indexOf("## This run's input");
  assert.ok(heading > 0);
  assert.equal(text.match(/\{\{args\}\}/g)?.length, 1);
  assert.ok(text.indexOf("{{args}}") > heading);
});
