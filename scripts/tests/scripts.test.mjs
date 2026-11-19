import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkParity, gateLines } from "../check-parity.mjs";
import { compare, parse } from "../lib/semver.mjs";
import { parseToml, tomlMultiline } from "../lib/toml-subset.mjs";
import { setVersion } from "../set-version.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("semver: prereleases sort before their release", () => {
  assert.ok(compare("1.0.0-beta.1", "1.0.0") < 0);
  assert.ok(compare("1.0.0-beta.2", "1.0.0-beta.10") < 0);
  assert.ok(compare("1.0.0-alpha", "1.0.0-beta") < 0);
  assert.ok(compare("1.0.1", "1.0.0-beta.9") > 0);
  assert.equal(compare("1.2.3", "1.2.3"), 0);
  assert.throws(() => parse("1.0"), /not a valid version/);
});

test("parity: every platform shares the five gate lines", async () => {
  const platforms = await checkParity();
  assert.deepEqual(platforms.sort(), ["claude", "codex", "dsh", "gemini"]);
});

test("parity: gateLines finds gate and part-failed lines", () => {
  const text = "⏸ GATE 1 - BRD\n...\n⏸ PART FAILED - part 2\n";
  assert.equal(gateLines(text).length, 2);
});

test("set-version: writes every file and refuses a lower version", () => {
  const copy = mkdtempSync(`${tmpdir()}/agent-plugin-flow-`);
  for (const entry of ["package.json", "packages"]) {
    cpSync(`${root}${entry}`, `${copy}/${entry}`, { recursive: true });
  }
  const files = setVersion("1.0.0-beta.2", `${copy}/`);
  assert.equal(files.length, 8);
  for (const file of files) {
    assert.match(readFileSync(file, "utf8"), /"version": "1\.0\.0-beta\.2"/);
  }
  assert.throws(
    () => setVersion("1.0.0-beta.1", `${copy}/`),
    /refusing to lower/,
  );
  assert.ok(readdirSync(`${copy}/packages`).includes("core"));
});

test("every package and the plugin manifest share the root version", () => {
  const version = JSON.parse(
    readFileSync(`${root}package.json`, "utf8"),
  ).version;
  for (const name of readdirSync(`${root}packages`)) {
    const pkg = JSON.parse(
      readFileSync(`${root}packages/${name}/package.json`, "utf8"),
    );
    assert.equal(pkg.version, version, `${name} version`);
  }
  const manifest = JSON.parse(
    readFileSync(`${root}packages/claude/.claude-plugin/plugin.json`, "utf8"),
  );
  assert.equal(manifest.version, version);
});

test("toml-subset: tomlMultiline round-trips awkward text exactly", () => {
  const samples = [
    "plain\ntext\n",
    "back\\slash and \"quotes\" and 'single'",
    "triple ''' inside\n",
    'triple """ inside\n',
    "ends with a quote'",
    "tab\there, bell \u0007, esc \u001b, del \u007f",
    "unicode ⏸ Phạm 中文\n",
    "{{args}} !{ @{ {model}\n",
    "",
  ];
  for (const text of samples) {
    const parsed = parseToml(`k = ${tomlMultiline(text)}\n`);
    assert.equal(parsed.k, text, JSON.stringify(text));
  }
});

test("toml-subset: rejects what it cannot read", () => {
  assert.throws(() => parseToml("a = 1\n"), /unsupported/);
  assert.throws(() => parseToml("a = '''x\n"), /unterminated/);
  assert.throws(() => parseToml('a = "x"\na = "y"\n'), /duplicate/);
  assert.deepEqual(parseToml('# c\na = "x" # d\n\nb = "y"\n'), {
    a: "x",
    b: "y",
  });
});
