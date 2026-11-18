/** Minimal semver helpers for `set-version`: `MAJOR.MINOR.PATCH[-pre.release]`. */

const PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

/**
 * Parse a version string.
 * @param {string} text - for example `1.0.0-beta.1`.
 * @returns {{ core: number[], pre: string[] }} the numeric core and the prerelease identifiers.
 */
export function parse(text) {
  const match = PATTERN.exec(text);
  if (!match) throw new Error(`not a valid version: ${text}`);
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    pre: match[4] ? match[4].split(".") : [],
  };
}

/**
 * Compare two versions by semver precedence (a prerelease sorts before its release).
 * @param {string} a
 * @param {string} b
 * @returns {number} negative when a < b, zero when equal, positive when a > b.
 */
export function compare(a, b) {
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < 3; i++) {
    if (left.core[i] !== right.core[i]) return left.core[i] - right.core[i];
  }
  if (left.pre.length === 0 || right.pre.length === 0) {
    return right.pre.length - left.pre.length;
  }
  const length = Math.max(left.pre.length, right.pre.length);
  for (let i = 0; i < length; i++) {
    const x = left.pre[i];
    const y = right.pre[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    const xNumber = /^\d+$/.test(x);
    const yNumber = /^\d+$/.test(y);
    if (xNumber && yNumber) return Number(x) - Number(y);
    if (xNumber) return -1;
    if (yNumber) return 1;
    return x < y ? -1 : 1;
  }
  return 0;
}
