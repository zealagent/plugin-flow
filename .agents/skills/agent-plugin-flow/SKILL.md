---
name: agent-plugin-flow-architecture
description: >-
  Use for any Zealamic Plugin Flow code, test, documentation, or release work:
  deciding where a change belongs (core source vs. generated copy vs. platform),
  keeping platforms in parity, validating behavior, and packaging releases.
---

# Zealamic Plugin Flow

Read `.agents/AGENTS.md` first, then the plan for the work (`plans/`). This file is compact and
holds no protocol text: the workflow itself lives in `packages/core/protocol/protocol.md`, and
what each platform does differently lives in `packages/core/platforms/<platform>/`.

## Map

```text
packages/core  (private source, never shipped)
  protocol/protocol.md        the workflow, with {{placeholders}}
  protocol/usage.txt          the one usage line
  platforms/<platform>/*.md   fragments: preamble, roles, coder-mechanisms (+ skill-header for claude)
  config/coder.example.json   the coder.json template
  icon.svg
        │  pnpm sync  (scripts/sync.mjs)
        ├──> packages/claude            Claude Code plugin: skills/zla-flow/SKILL.md, config/
        └──> packages/dsh  Harness bundle: protocol.js, client.js template block, config/, icon.svg
.claude-plugin/marketplace.json  ->  packages/claude
```

- **Core** owns every statement about how the workflow behaves: phases, gates, state file,
  coder resolution, flags, hard rules. It runs nothing.
- **Platforms** own how that protocol reaches a host: a skill file for Claude Code, a slash
  command plus a sidebar page for the DeepSeek Harness. They render core; they never restate it.

## Generated files

| Source | Generated into |
| --- | --- |
| `protocol/protocol.md` + `platforms/claude/*.md` + `usage.txt` | `packages/claude/skills/zla-flow/SKILL.md` |
| `protocol/protocol.md` + `platforms/dsh/*.md` + `usage.txt` | `packages/dsh/protocol.js` (`USAGE`, `PROTOCOL`) |
| `config/coder.example.json` | `packages/claude/config/`, `packages/dsh/config/`, and the `CODER_TEMPLATE` block in `packages/dsh/client.js` |
| `icon.svg` | `packages/dsh/icon.svg` (the Claude `icon.png` is rendered by hand) |

`{{usage}}` is the usage line; every other `{{name}}` is the file
`platforms/<platform>/<name>.md`, trimmed. Every platform needs every fragment the protocol
uses; an empty file is allowed. `scripts/sync.mjs` is the only writer of generated files.

## Where a change belongs

| Change | Goes in |
| --- | --- |
| A phase, gate, flag, state field, or hard rule | `packages/core/protocol/protocol.md`, then `pnpm sync` |
| Something true for one platform only (how a coder is launched, which roles can be delegated) | `packages/core/platforms/<platform>/<fragment>.md` |
| A new `coder.json` field or profile default | `packages/core/config/coder.example.json` (all three consumers update on sync) |
| Panel layout, locale strings, command registration | `packages/dsh/{client.js,index.js,locale/}` (hand-written) |
| Plugin manifest, icon, marketplace entry | `packages/claude/.claude-plugin/`, `.claude-plugin/marketplace.json` |
| A new platform | see below |

If a sentence would be the same on both platforms, it belongs in core, not duplicated in two
fragments. If you are about to hand-edit a generated file, stop and edit its source.

## Gate parity

Five lines begin with ⏸: GATE 0, 1, 2, 3 and PART FAILED. They are the contract with the user
and must be word-for-word identical on every platform. `pnpm check:parity` compares the lines in
what each platform actually ships. Do not localize them; the model answers in the user's
language but keeps these lines in English.

## Change workflow

1. Read the plan and the relevant source (core first).
2. Edit the source, not a copy.
3. `pnpm sync`, then review the diff of the generated files: it should be the mechanical
   consequence of your edit and nothing else.
4. Add or update a test in the owning package (`packages/*/tests/*.test.mjs`, or
   `scripts/tests/` for scripts).
5. `pnpm check`. Fix lint with `pnpm lint:fix`.
6. If boundaries, commands, or workflows changed, update `.agents/AGENTS.md`, the rule, and this
   skill.

## Test and build workflow

- No build step exists. The Harness loads `index.js` and `client.js` from source; the Claude
  plugin is read as files.
- Tests use `node:test` only. The Harness test loads `client.js` against stub React and DOM
  globals, so a UI change that adds a `t("key")` call must add the key to both locale
  dictionaries (`en` and `vi`) in `client.js`.
- `pnpm typecheck` covers scripts, tests, `index.js` and `client.js` with `checkJs`; give new
  functions a JSDoc type when a caller could misuse them.
- A change to the protocol is verified by reading the rendered output
  (`packages/claude/skills/zla-flow/SKILL.md`, `PROTOCOL` in `protocol.js`), not only by tests.

## Adding a platform

1. Create `packages/core/platforms/<platform>/` with one `.md` per placeholder the protocol uses.
2. Create `packages/<platform>/` with its own `package.json` (`@zealamic/agent-plugin-flow-<platform>`,
   the shared version, a `test` script) and `tests/`.
3. Add its outputs to the `outputs` list in `scripts/sync.mjs` and its protocol to
   `shippedProtocols()` in `scripts/check-parity.mjs`.
4. Run `pnpm sync`, then `pnpm check`. Add the package README (EN/VI/CN) following the
   readme-system skill, and a row in `AGENTS.md` and the root README.

## Versions and packaging

- `pnpm set-version 1.0.0-beta.2` changes the root, every package, and `plugin.json` together
  and refuses a lower version. Prereleases sort before their release.
- `pnpm pack:packages` writes `artifacts/`: the Claude plugin tarball (without tests) and the
  Harness tarball (`pnpm pack`, honoring its `files` list). Inspect the contents before any
  release.

## Release

Manual. Agents prepare and verify; the maintainer publishes.

1. `pnpm set-version <v>`, `pnpm sync`.
2. `pnpm release:check`.
3. Maintainer only: tag, push, publish the Harness bundle, and let `/plugin marketplace add
   zealamic/agent-plugin-flow` pick up the Claude plugin from the repository.

Agents never tag, push a tag, publish, or create a release. Say which of these steps were not
run.

## Documentation

Root README plus one README per published package (`claude`, `dsh`) and the core
maintainer README, in EN, VI, and CN. Load `.agents/skills/readme-system/SKILL.md` before
editing any README. Per-platform READMEs describe the platform in its own words; the protocol
text is never copied into a README.
