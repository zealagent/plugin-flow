#!/usr/bin/env node
/**
 * Install the zlak-flow command and its subagents for OpenCode.
 *
 *   node install.mjs [--global] [--target <dir>] [--force] [--dry-run]
 *
 * Copies commands/ and agents/ into an OpenCode config directory:
 *   default     ./.opencode              (this project only)
 *   --global    ~/.config/opencode       (every project of this user)
 *   --target    <dir>                    (any OpenCode config directory)
 * It never overwrites a file you changed without --force, and skips files that are
 * already identical.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const args = process.argv.slice(2);
let target = join(process.cwd(), ".opencode");
let force = false;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--global") target = join(homedir(), ".config", "opencode");
  else if (arg === "--target") {
    const value = args[++i];
    if (!value) fail("--target needs a directory", 2);
    target = value;
  } else if (arg === "--force") force = true;
  else if (arg === "--dry-run") dryRun = true;
  else if (arg === "-h" || arg === "--help") {
    console.log(
      "Usage: node install.mjs [--global] [--target <dir>] [--force] [--dry-run]",
    );
    process.exit(0);
  } else fail(`unknown option: ${arg}`, 2);
}

/** Print an error and exit. */
function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

/** Every file to install, as [from, to] pairs relative to the package and the target. */
const files = ["commands", "agents"].flatMap((dir) =>
  readdirSync(join(here, dir))
    .filter((name) => name.endsWith(".md"))
    .map((name) => [join(here, dir, name), join(target, dir, name)]),
);

const blocked = files.filter(
  ([from, to]) =>
    existsSync(to) && !readFileSync(from).equals(readFileSync(to)) && !force,
);
if (blocked.length > 0) {
  fail(
    `refusing to overwrite changed files (use --force):\n${blocked
      .map(([, to]) => `  ${to}`)
      .join("\n")}`,
  );
}

let changed = 0;
for (const [from, to] of files) {
  if (existsSync(to) && readFileSync(from).equals(readFileSync(to))) continue;
  changed++;
  if (dryRun) {
    console.log(`would install ${to}`);
    continue;
  }
  mkdirSync(join(to, ".."), { recursive: true });
  copyFileSync(from, to);
  console.log(`installed ${to}`);
}
if (changed === 0)
  console.log(`zlak-flow is already installed and up to date: ${target}`);
else if (!dryRun) console.log("restart OpenCode, then run /zlak-flow <task>");
