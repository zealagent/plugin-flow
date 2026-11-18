/**
 * Set one version in every package of the repository.
 *
 *   node scripts/set-version.mjs <version>
 *
 * Writes the root package.json, every packages/<name>/package.json and the
 * Claude plugin manifest. Refuses a version lower than the current one.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { compare, parse } from "./lib/semver.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

/** Every file whose top-level `version` field is managed by this script. */
export function versionFiles() {
  return [
    "package.json",
    ...readdirSync(`${root}packages`).map(
      (name) => `packages/${name}/package.json`,
    ),
    "packages/claude/.claude-plugin/plugin.json",
  ];
}

/**
 * Apply a version to every managed file.
 * @param {string} version - the new version.
 * @param {string} [base] - the repository root, for tests.
 * @returns {string[]} the files written.
 */
export function setVersion(version, base = root) {
  parse(version);
  const files = versionFiles().map((file) => base + file);
  const current = JSON.parse(readFileSync(files[0], "utf8")).version;
  if (compare(version, current) < 0) {
    throw new Error(
      `refusing to lower the version from ${current} to ${version}`,
    );
  }
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const next = text.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`);
    if (next === text && !text.includes(`"version": "${version}"`)) {
      throw new Error(`no version field in ${file}`);
    }
    writeFileSync(file, next);
  }
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const version = process.argv[2];
  if (!version) {
    console.error("Usage: pnpm set-version <version>");
    process.exit(1);
  }
  try {
    const files = setVersion(version);
    console.log(`Set ${version} in ${files.length} files`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
