/**
 * Pack what ships into artifacts/ (git-ignored). Nothing is published.
 *
 *   node scripts/pack-packages.mjs
 *
 * One artifact per platform, in the format its platform.json `pack` names:
 * - tar: a tarball of the plugin folder, minus the listed excludes.
 * - pnpm-pack: `pnpm pack`, which honors the package's `files` list.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { platforms, repoRoot as root } from "./lib/platforms.mjs";

const artifacts = `${root}artifacts`;
const version = JSON.parse(readFileSync(`${root}package.json`, "utf8")).version;

rmSync(artifacts, { recursive: true, force: true });
mkdirSync(artifacts, { recursive: true });

for (const platform of platforms()) {
  if (platform.pack.type === "tar") {
    const file = `${artifacts}/zealakit-agent-plugin-flow-${platform.id}-${version}.tgz`;
    execFileSync(
      "tar",
      [
        "-czf",
        file,
        "-C",
        `${root}packages`,
        ...(platform.pack.exclude ?? []).map(
          (name) => `--exclude=${platform.id}/${name}`,
        ),
        "--exclude=.DS_Store",
        platform.id,
      ],
      {
        stdio: "inherit",
        // macOS tar would otherwise add ._* AppleDouble entries to the archive.
        env: { ...process.env, COPYFILE_DISABLE: "1" },
      },
    );
    console.log(`packed ${file}`);
  } else if (platform.pack.type === "pnpm-pack") {
    execFileSync("pnpm", ["pack", "--pack-destination", artifacts], {
      cwd: `${root}packages/${platform.id}`,
      stdio: "inherit",
    });
  } else {
    throw new Error(`${platform.id}: unknown pack type ${platform.pack.type}`);
  }
}
