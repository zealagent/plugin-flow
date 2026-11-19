/**
 * Manual npm publish for the Plugin Flow platform packages.
 *
 *   pnpm npm:publish:check
 *   pnpm npm:publish:claude | npm:publish:codex | npm:publish:gemini | npm:publish:opencode | npm:publish:dsh
 *   pnpm npm:publish:all
 *
 * Only the platform packages are published. `@zealakit/agent-plugin-flow-core` is private and
 * internal: `pnpm sync` copies what the platforms need into them, so core never needs to
 * exist on npm and must never be uploaded. Every package is validated, checked, packed and
 * inspected before any upload. A prerelease version is published under the `next` dist-tag,
 * never `latest`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "./lib/semver.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const CORE_NAME = "@zealakit/agent-plugin-flow-core";

type PackageId = "claude" | "codex" | "dsh" | "gemini" | "opencode";
type Command = "check" | PackageId | "all";
type DependencyField =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

type PackageJson = {
  name?: string;
  version?: string;
  private?: boolean;
  license?: string;
  files?: string[];
  publishConfig?: { access?: string };
  scripts?: Record<string, string>;
} & Partial<Record<DependencyField, Record<string, string>>>;

type PackageMeta = {
  id: PackageId;
  label: string;
  expectedName: string;
  /** Files that must be in the tarball, relative to the package root. */
  required: string[];
};

type PackageConfig = PackageMeta & {
  packageDir: string;
  packageJsonPath: string;
  manifest: PackageJson;
};

type PackedFile = { path: string };

const PACKAGES: PackageMeta[] = [
  {
    id: "claude",
    label: "Claude Code",
    expectedName: "@zealakit/agent-plugin-flow-claude",
    required: [
      ".claude-plugin/plugin.json",
      ".claude-plugin/icon.png",
      "skills/zlak-flow/SKILL.md",
      "config/coder.example.json",
      "README.md",
      "LICENSE",
      "package.json",
    ],
  },
  {
    id: "codex",
    label: "Codex CLI",
    expectedName: "@zealakit/agent-plugin-flow-codex",
    required: [
      "skills/zlak-flow/SKILL.md",
      "skills/zlak-flow/agents/openai.yaml",
      "config/coder.example.json",
      "install.sh",
      "README.md",
      "LICENSE",
      "package.json",
    ],
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    expectedName: "@zealakit/agent-plugin-flow-gemini",
    required: [
      "gemini-extension.json",
      "commands/zlak-flow.toml",
      "config/coder.example.json",
      "README.md",
      "LICENSE",
      "package.json",
    ],
  },
  {
    id: "opencode",
    label: "OpenCode",
    expectedName: "@zealakit/agent-plugin-flow-opencode",
    required: [
      "commands/zlak-flow.md",
      "agents/zlak-flow-planner.md",
      "agents/zlak-flow-reviewer.md",
      "agents/zlak-flow-coder.md",
      "config/coder.example.json",
      "install.mjs",
      "README.md",
      "LICENSE",
      "package.json",
    ],
  },
  {
    id: "dsh",
    label: "DeepSeek Harness",
    expectedName: "@zealakit/agent-plugin-flow-dsh",
    required: [
      "index.js",
      "client.js",
      "protocol.js",
      "cordis.patch.yml",
      "icon.svg",
      "config/coder.example.json",
      "locale/en.json",
      "locale/vi.json",
      "README.md",
      "LICENSE",
      "package.json",
    ],
  },
];

/** Paths that must never ship. */
const FORBIDDEN = [/^tests\//, /^node_modules\//, /\.test\.m?js$/, /^\.env/];

const DEPENDENCY_FIELDS: DependencyField[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function printHelp(): void {
  console.log(`Usage:
  pnpm npm:publish:check
  pnpm npm:publish:claude
  pnpm npm:publish:codex
  pnpm npm:publish:gemini
  pnpm npm:publish:opencode
  pnpm npm:publish:dsh
  pnpm npm:publish:all

Or:
  node --strip-types scripts/npm-publish.ts <check|claude|codex|gemini|opencode|dsh|all>

check             Run every pre-publish check for all packages (no publish)
claude            Validate, check, pack and publish @zealakit/agent-plugin-flow-claude
codex             Validate, check, pack and publish @zealakit/agent-plugin-flow-codex
gemini            Validate, check, pack and publish @zealakit/agent-plugin-flow-gemini
opencode          Validate, check, pack and publish @zealakit/agent-plugin-flow-opencode
dsh               Validate, check, pack and publish @zealakit/agent-plugin-flow-dsh
all               Publish claude → codex → gemini → opencode → dsh sequentially (stops on first failure)

Core (@zealakit/agent-plugin-flow-core) is internal and is never published.
`);
}

function fail(message: string): never {
  throw new Error(message);
}

function parseCommand(argv: string[]): Command {
  const command = argv[0];
  if (
    command === "check" ||
    command === "claude" ||
    command === "codex" ||
    command === "gemini" ||
    command === "opencode" ||
    command === "dsh" ||
    command === "all"
  ) {
    return command;
  }
  printHelp();
  fail(
    command
      ? `Unknown command "${command}".`
      : "Missing command. Pass check, claude, codex, gemini, opencode, dsh, or all.",
  );
}

function readJson(filePath: string): PackageJson {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as PackageJson;
  } catch (error) {
    fail(
      `Failed to read ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function getPackageConfig(id: PackageId): PackageConfig {
  const meta = PACKAGES.find((item) => item.id === id);
  if (!meta) fail(`Unknown package id "${id}".`);
  const packageDir = path.join(PROJECT_ROOT, "packages", meta.id);
  const packageJsonPath = path.join(packageDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    fail(`package.json not found: ${packageJsonPath}`);
  }
  return {
    ...meta,
    packageDir,
    packageJsonPath,
    manifest: readJson(packageJsonPath),
  };
}

/** Core must stay private; refuse to run if someone made it publishable. */
function assertCoreIsPrivate(): void {
  const core = readJson(path.join(PROJECT_ROOT, "packages/core/package.json"));
  if (core.name !== CORE_NAME || core.private !== true) {
    fail(
      `${CORE_NAME} must keep "private": true. Core is internal and is never published.`,
    );
  }
}

function distTag(version: string): "next" | "latest" {
  return parse(version).pre.length > 0 ? "next" : "latest";
}

function validatePackage(pkg: PackageConfig): void {
  const { manifest, expectedName, label, packageJsonPath } = pkg;
  const rootVersion = readJson(path.join(PROJECT_ROOT, "package.json")).version;

  if (manifest.private === true) {
    fail(`${label} package is marked private and cannot be published.`);
  }
  if (manifest.name !== expectedName) {
    fail(
      `${label} package name mismatch in ${packageJsonPath}: expected "${expectedName}", found "${manifest.name ?? "(missing)"}".`,
    );
  }
  if (!manifest.version) fail(`${label} package has no version.`);
  try {
    parse(manifest.version);
  } catch {
    fail(`${label} package has an invalid version: "${manifest.version}".`);
  }
  if (manifest.version !== rootVersion) {
    fail(
      `${label} version ${manifest.version} differs from the root version ${rootVersion}. Use pnpm set-version.`,
    );
  }
  if (!manifest.files || manifest.files.length === 0) {
    fail(`${label} package is missing a non-empty "files" field.`);
  }
  if (manifest.license !== "MIT") {
    fail(`${label} package must declare "license": "MIT".`);
  }
  if (manifest.publishConfig?.access !== "public") {
    fail(
      `${label} package must set publishConfig.access to "public" (found "${manifest.publishConfig?.access ?? "(missing)"}").`,
    );
  }
  if (!manifest.scripts?.test) {
    fail(`${label} package is missing script "test".`);
  }
  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
      if (name === CORE_NAME) {
        fail(
          `${label} lists ${CORE_NAME} in ${field}. Platforms must be self-contained.`,
        );
      }
      if (/^(workspace|link|file|portal):/.test(spec)) {
        fail(`${label} has a local specifier in ${field}: ${name}@${spec}.`);
      }
    }
  }
  if (pkg.id === "claude") {
    const plugin = readJson(
      path.join(pkg.packageDir, ".claude-plugin/plugin.json"),
    );
    if (plugin.version !== manifest.version) {
      fail(
        `plugin.json version ${plugin.version} differs from package.json ${manifest.version}.`,
      );
    }
  }
}

function runCaptured(
  command: string,
  args: string[],
  cwd: string,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  if (result.error) {
    fail(`Failed to run ${command} ${args.join(" ")}: ${result.error.message}`);
  }
  return {
    status: result.status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

function runInherited(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) {
    fail(`Failed to run ${command} ${args.join(" ")}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
}

function checkNpmAuthentication(): string {
  const result = runCaptured("npm", ["whoami"], PROJECT_ROOT);
  if (result.status !== 0 || !result.stdout) {
    const detail = result.stderr || result.stdout || "unknown error";
    fail(
      `npm is not authenticated. Run \`npm login\` first.\nDetails: ${detail}`,
    );
  }
  return result.stdout;
}

function isNpmNotFound(stderr: string, stdout: string): boolean {
  const text = `${stderr}\n${stdout}`;
  return (
    /\bE404\b/.test(text) ||
    /404 Not Found/i.test(text) ||
    /code E404/i.test(text) ||
    /version not found/i.test(text)
  );
}

function checkVersionAvailability(pkg: PackageConfig): void {
  const name = pkg.manifest.name as string;
  const version = pkg.manifest.version as string;
  const result = runCaptured(
    "npm",
    ["view", `${name}@${version}`, "version"],
    PROJECT_ROOT,
  );
  if (result.status === 0 && result.stdout) {
    fail(
      `${name}@${version} already exists on npm. Run pnpm set-version <next> before publishing.`,
    );
  }
  if (result.status === 0 || isNpmNotFound(result.stderr, result.stdout)) {
    return;
  }
  const detail = result.stderr || result.stdout || `exit ${result.status}`;
  fail(
    `Could not verify whether ${name}@${version} exists on npm.\nDetails: ${detail}`,
  );
}

/** Repository-wide checks: generated copies, typecheck, tests, lint, parity, READMEs. */
function runRepositoryChecks(): void {
  runInherited("pnpm", ["run", "check"], PROJECT_ROOT);
  runInherited("pnpm", ["run", "readme:check"], PROJECT_ROOT);
}

function inspectPackage(pkg: PackageConfig): void {
  const result = runCaptured(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts"],
    pkg.packageDir,
  );
  if (result.status !== 0) {
    fail(`npm pack --dry-run failed for ${pkg.label}:\n${result.stderr}`);
  }
  const [report] = JSON.parse(result.stdout) as Array<{ files: PackedFile[] }>;
  const files = report.files.map((file) => file.path);

  const missing = pkg.required.filter((file) => !files.includes(file));
  if (missing.length > 0) {
    fail(`${pkg.label} tarball is missing: ${missing.join(", ")}`);
  }
  const forbidden = files.filter((file) =>
    FORBIDDEN.some((pattern) => pattern.test(file)),
  );
  if (forbidden.length > 0) {
    fail(`${pkg.label} tarball must not contain: ${forbidden.join(", ")}`);
  }
  for (const file of files.filter((name) => /\.m?js$/.test(name))) {
    const text = fs.readFileSync(path.join(pkg.packageDir, file), "utf8");
    if (text.includes(`from "${CORE_NAME}`) || text.includes(`"../core/`)) {
      fail(`${pkg.label} ${file} imports core at runtime.`);
    }
  }
  console.log(`${pkg.label} tarball: ${files.length} files`);
  for (const file of files) console.log(`  ${file}`);
}

function publishPackage(pkg: PackageConfig): void {
  const tag = distTag(pkg.manifest.version as string);
  runInherited(
    "npm",
    ["publish", "--access", "public", "--tag", tag],
    pkg.packageDir,
  );
}

function logStep(current: number, total: number, message: string): void {
  console.log(`\n[${current}/${total}] ${message}`);
}

function preparePackage(
  pkg: PackageConfig,
  options: { publish: boolean },
): void {
  const total = options.publish ? 4 : 3;
  const name = pkg.manifest.name as string;
  const version = pkg.manifest.version as string;
  console.log(`\n=== ${pkg.label}: ${name}@${version} ===`);

  logStep(1, total, `Validating ${pkg.label} package`);
  validatePackage(pkg);
  checkVersionAvailability(pkg);

  logStep(2, total, `Testing ${pkg.label} package`);
  runInherited("pnpm", ["run", "test"], pkg.packageDir);

  logStep(3, total, `Checking ${pkg.label} package contents`);
  inspectPackage(pkg);

  if (!options.publish) {
    console.log(`\n${pkg.label} package checks passed (not published).`);
    return;
  }

  logStep(
    4,
    total,
    `Publishing ${pkg.label} package (tag ${distTag(version)})`,
  );
  publishPackage(pkg);
  console.log(`\n${pkg.label} package published successfully.`);
}

function main(): void {
  const command = parseCommand(process.argv.slice(2));
  process.chdir(PROJECT_ROOT);
  assertCoreIsPrivate();

  const npmUser = checkNpmAuthentication();
  console.log(`npm user: ${npmUser}`);
  console.log(`repository: ${PROJECT_ROOT}`);

  console.log("\n=== Repository checks ===");
  runRepositoryChecks();

  const ids: PackageId[] =
    command === "check" || command === "all"
      ? PACKAGES.map((item) => item.id)
      : [command];

  if (command === "check") {
    for (const id of ids) {
      preparePackage(getPackageConfig(id), { publish: false });
    }
    console.log("\nAll package checks passed. Nothing was published.");
    return;
  }

  const published: string[] = [];
  for (const id of ids) {
    const pkg = getPackageConfig(id);
    try {
      preparePackage(pkg, { publish: true });
      published.push(`${pkg.manifest.name}@${pkg.manifest.version}`);
    } catch (error) {
      console.error("\n=== Publish summary ===");
      console.error(
        `Published: ${published.length > 0 ? published.join(", ") : "(none)"}`,
      );
      console.error(`Failed: ${pkg.manifest.name}@${pkg.manifest.version}`);
      console.error(
        "Note: npm publishing is not atomic. Successful packages above remain published.",
      );
      throw error;
    }
  }
  console.log("\n=== Publish summary ===");
  console.log(`Published: ${published.join(", ")}`);
}

try {
  main();
} catch (error) {
  console.error(
    `\nError: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
