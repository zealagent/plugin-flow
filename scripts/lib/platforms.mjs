/**
 * The platform registry: one `platform.json` per folder under
 * packages/core/platforms/. Sync, parity, version, pack and README checks read
 * it, so a new platform is one folder plus one package.
 *
 * Fields of `platform.json` (paths are relative to `packages/<id>/` unless noted):
 *   name            display name used in READMEs ("Claude Code")
 *   format          "skill-md" (header + protocol + input section), "toml-command" (Gemini
 *                   command file: description + prompt) or "js-module" (protocol.js)
 *   description     one line for formats that carry one (toml-command)
 *   output          the shipped protocol file
 *   header          fragment (in the platform folder) put before the protocol, or null
 *   args            host placeholder for the run's input, appended after rendering, or null
 *   copies          [{ from, to }]: files copied from packages/core into the package
 *   clientTemplate  a file whose coder-template block is generated, optional
 *   manifests       extra files carrying the shared version
 *   pack            { type: "tar", exclude: [...] } or { type: "pnpm-pack" }
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const coreDir = fileURLToPath(
  new URL("../../packages/core/", import.meta.url),
);
export const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Load every platform definition.
 * @returns {Array<{ id: string, name: string, format: string, description?: string, output: string, header: string | null, args: string | null, copies: { from: string, to: string }[], clientTemplate?: string, manifests: string[], pack: { type: string, exclude?: string[] } }>}
 */
export function platforms() {
  return readdirSync(`${coreDir}platforms`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((id) => ({
      id,
      ...JSON.parse(
        readFileSync(`${coreDir}platforms/${id}/platform.json`, "utf8"),
      ),
    }));
}
