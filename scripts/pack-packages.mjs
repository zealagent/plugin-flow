/**
 * Pack what ships into artifacts/ (git-ignored). Nothing is published.
 *
 *   node scripts/pack-packages.mjs
 *
 * - Claude Code plugin: a tarball of the plugin folder, without tests.
 * - DeepSeek Harness bundle: `pnpm pack`, which honors its `files` list.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const artifacts = `${root}artifacts`;
const version = JSON.parse(readFileSync(`${root}package.json`, "utf8")).version;

rmSync(artifacts, { recursive: true, force: true });
mkdirSync(artifacts, { recursive: true });

const claudeFile = `${artifacts}/zealamic-agent-plugin-flow-claude-${version}.tgz`;
execFileSync(
  "tar",
  [
    "-czf",
    claudeFile,
    "-C",
    `${root}packages`,
    "--exclude=tests",
    "--exclude=package.json",
    "claude",
  ],
  { stdio: "inherit" },
);
console.log(`packed ${claudeFile}`);

execFileSync("pnpm", ["pack", "--pack-destination", artifacts], {
  cwd: `${root}packages/dsh`,
  stdio: "inherit",
});
