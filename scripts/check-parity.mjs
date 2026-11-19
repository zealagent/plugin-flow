/**
 * Platform parity: every platform must carry the same five ⏸ gate lines,
 * word for word, in the protocol it actually ships.
 *
 *   node scripts/check-parity.mjs
 *
 * The shipped protocols are `packages/claude/skills/zlak-flow/SKILL.md` and the
 * `PROTOCOL` constant of `packages/dsh/protocol.js`.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

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

/** Load every shipped protocol, keyed by platform. */
export async function shippedProtocols() {
  const harness = await import(`${root}packages/dsh/protocol.js`);
  return {
    claude: readFileSync(
      `${root}packages/claude/skills/zlak-flow/SKILL.md`,
      "utf8",
    ),
    dsh: harness.PROTOCOL,
  };
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
