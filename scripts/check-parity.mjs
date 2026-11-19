/**
 * Platform parity: every platform must carry the same five ⏸ gate lines,
 * word for word, in the protocol it actually ships.
 *
 *   node scripts/check-parity.mjs
 *
 * The shipped protocol of each platform is the `output` its platform.json names:
 * a Markdown file, or the `PROTOCOL` constant of a JS module.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { platforms } from "./lib/platforms.mjs";
import { parseToml } from "./lib/toml-subset.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

/**
 * Pull the gate lines out of a protocol text.
 * @param {string} text
 * @returns {string[]} the sorted ⏸ GATE / PART FAILED lines.
 */
export function gateLines(text) {
  return [...text.matchAll(/⏸ (?:GATE \d|PART FAILED) - [^\n]*/g)]
    .map((match) => match[0])
    .sort();
}

/** Load every shipped protocol, keyed by platform, as the platform.json files declare. */
export async function shippedProtocols() {
  const loaded = {};
  for (const platform of platforms()) {
    const file = `${root}packages/${platform.id}/${platform.output}`;
    if (platform.format === "js-module") {
      loaded[platform.id] = (await import(pathToFileURL(file).href)).PROTOCOL;
    } else if (platform.format === "toml-command") {
      loaded[platform.id] = parseToml(readFileSync(file, "utf8")).prompt;
    } else {
      loaded[platform.id] = readFileSync(file, "utf8");
    }
  }
  return loaded;
}

/** Assert the five gate lines match on every platform. */
export async function checkParity() {
  const protocols = await shippedProtocols();
  let reference;
  for (const [platform, text] of Object.entries(protocols)) {
    const lines = gateLines(text);
    assert.equal(lines.length, 5, `${platform}: five gate lines`);
    reference ??= lines;
    assert.deepEqual(
      lines,
      reference,
      `${platform}: gate lines match the other platforms`,
    );
  }
  return Object.keys(protocols);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const platforms = await checkParity();
  console.log(`parity: ${platforms.join(", ")} share the same gate lines`);
}
