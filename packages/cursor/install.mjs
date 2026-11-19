#!/usr/bin/env node
/**
 * Install the zlak-flow plugin for Cursor.
 *
 *   node install.mjs [--project <dir>] [--target <dir>] [--force] [--dry-run]
 *
 * Copies the plugin (.cursor-plugin/, commands/, agents/) into Cursor's local plugin
 * directory, ~/.cursor/plugins/local/zlak-flow, or into --target. With --project it also
 * copies agents/ into <dir>/.cursor/agents, where Cursor documents the `readonly` key of a
 * subagent definition.
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
let target = join(homedir(), ".cursor", "plugins", "local", "zlak-flow");
let project = null;
let force = false;
let dryRun = false;

/** Print an error and exit. */
function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--target" || arg === "--project") {
    const value = args[++i];
    if (!value) fail(`${arg} needs a directory`, 2);
    if (arg === "--target") target = value;
    else project = value;
  } else if (arg === "--force") force = true;
  else if (arg === "--dry-run") dryRun = true;
  else if (arg === "-h" || arg === "--help") {
    console.log(
      "Usage: node install.mjs [--project <dir>] [--target <dir>] [--force] [--dry-run]",
    );
    process.exit(0);
  } else fail(`unknown option: ${arg}`, 2);
}

/** Every file under a directory of this package, as relative paths. */
function walk(dir) {
  return readdirSync(join(here, dir), { withFileTypes: true }).flatMap(
    (entry) =>
      entry.isDirectory()
        ? walk(join(dir, entry.name))
        : [join(dir, entry.name)],
  );
}

const files = [".cursor-plugin", "commands", "agents"]
  .flatMap(walk)
  .map((path) => [join(here, path), join(target, path)]);
if (project) {
  for (const path of walk("agents")) {
    files.push([join(here, path), join(project, ".cursor", path)]);
  }
}
const same = (from, to) =>
  existsSync(to) && readFileSync(from).equals(readFileSync(to));

const blocked = files.filter(
  ([from, to]) => existsSync(to) && !same(from, to) && !force,
);
if (blocked.length > 0) {
  fail(
    `refusing to overwrite changed files (use --force):\n${blocked.map(([, to]) => `  ${to}`).join("\n")}`,
  );
}

let changed = 0;
for (const [from, to] of files) {
  if (same(from, to)) continue;
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
else if (!dryRun)
  console.log(
    "reload the Cursor window, then run /zlak-flow <task> in Agent chat",
  );
