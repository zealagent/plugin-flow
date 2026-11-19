---
name: readme-system
description: >-
  Use when creating, editing, translating, or reviewing READMEs for a library or monorepo
  (root and package). Provides a reusable hub-and-spoke README system: file layout, section
  order, table/code/link rules, voice, translation parity, and a pre-flight checklist. Adapt
  the Profile section when copying the skill to another repository.
---

# README system (hub + spoke)

One root README for navigation; one README per published unit holding the full API. Each
README must read well on GitHub and npm. English is the source; translation files mirror it.

This skill is a reusable template. Everything repository-specific lives in
[Profile](#0-profile). When copying it to another source tree, edit that block, map the units
to layouts in [section 3](#3-unit-readme-layout-profiles), delete what the target repo does
not use, then run its checker.

## 0. Profile

Fill this once per repository. The values below are the current values for this repo; replace
them when porting. Rules later reference the keys, not the literal values.

| Key | Current value | Used by |
| --- | --- | --- |
| Project name | `Zealakit Agent Plugin Flow` | Root H1, cover alt text |
| Org / repo | `zealakit/agent-plugin-flow` | Absolute links |
| Absolute base | `https://github.com/zealakit/agent-plugin-flow/blob/main` | Every cross-link |
| Cover image | `<base>/assets/images/agent-plugin-flow-cover.jpg?raw=true` | Root + unit READMEs |
| License line | `MIT © Zealakit` | Last section |
| Languages | EN `README.md`, VI `README_VI.md`, CN `README_CN.md` | Switcher, parity |
| Units | root + `packages/{core,claude,codex,dsh,gemini,opencode}` | File set, checker |
| Layouts | claude, codex, dsh, gemini, opencode → plugin; core → maintainer | Section 3 |
| Package READMEs excluded | `plans/`, `scripts/` | File structure |
| Internal agent skills | `.agents/skills/{agent-plugin-flow,readme-system}/SKILL.md` | Never linked from user-facing READMEs |
| User-facing integration skills | none (the plugin is the skill) | Root has no `## Agent Skills` section |
| Checker | `pnpm readme:check` | Pre-flight checklist |
| Architecture skill | `.agents/skills/agent-plugin-flow/SKILL.md` | Optional pre-read |

Canonical `> **Note**` text (the same wording in every README and language):

```text
> **Note**
> Plugin Flow runs a PM/Reviewer workflow with a human approval gate at every step: BRD, Plan, delegated coding, Review, Commit. It never skips a gate and never stores an API key; it names the environment variable that holds one.
>
> It is not a coding model or an agent runtime. The coder is whatever model or CLI you configure in `.zlak-flow/coder.json`.
```

Each release updates the Note in all three languages and in every README at once;
`pnpm readme:check` enforces the structure around it.

Single-language or single-package repos can delete the language and layout rows they do not
use; the rest of the skill still applies.

## 1. File structure

- Root README plus one README per published unit (package/workspace/crate), in every configured
  language: `README.md` (source language) + `README_<LANG>.md`.
- Private, non-product trees (`examples/`, `tools/`, `monitor/`) do not get READMEs unless the
  host repo treats them as products.
- Headings stay in the source language in all translations so anchors match. Prose, table
  cells, and code comments follow the target language.
- No separate `docs/` app unless the host repo already has one. Design rationale belongs in the
  owning unit README; process guidance belongs in agent skills or `CONTRIBUTING`.
- Translations must match the source README exactly for heading text and order, code block
  contents, and table shape (column count and order). Only prose differs.
- If the repo ships a README checker, it is the source of truth. Read it before changing
  structure; update it when the profile changes.

## 2. Root README: mandatory order

For a multi-unit repo:

1. `# <Project name>`
2. Language switcher: one link per configured language, in profile order, for example
   `[English](<base>/README.md) | [<Language>](<base>/README_<LANG>.md)`.
3. Cover image (optional): `![<Project name> cover](<cover>)`.
4. One tagline sentence (what it is, who it is for), bullets for the top-level units, one
   paragraph on what it does not do.
5. Canonical `> **Note**` scope warning.
6. `## Platforms`: table `Platform | Package | Documentation` with absolute links, then one
   sentence that each platform plugin is self-contained and installs independently.
7. `## Installation`: one `bash` block per platform with its install commands. No explanation.
8. `## Examples` (only if `examples/` exists): sample `coder.json` setups.
9. Optional end-user sections only when they help consumers. Omit maintainer tooling
   (`pnpm sync`, `check`, `pack:packages`) from the root; it lives in `AGENTS.md` and the core README.
10. No `## Agent Skills` section: this repo ships no separate user-facing skills, and the
    internal `.agents/skills` files are never linked.
11. `## License`.

No badges, screenshot gallery, changelog, roadmap, contributing, or API tables in the root
README. The root is navigation; APIs live in the unit READMEs.

For a single-package repo, sections 1–5 and License are enough; install and API sections live
in the unit README.

## 3. Unit README: layout profiles

Pick one layout per unit in the profile and keep its section order. Every layout shares:
H1 equal to the unit name listed in `scripts/check-readmes.mjs`, language switcher + cover (reuse the root image), canonical
Note, `## License`, and (except the maintainer layout) `## Install`.

### plugin layout (`claude`, `codex`, `dsh`, `gemini`, `opencode`)

1. `# zlak-flow for <platform>` (for example `zlak-flow for Claude Code`)
2. Language switcher + cover.
3. Lead: what the plugin adds to the platform, in two or three sentences.
4. Canonical Note.
5. `## Install`: one `bash` block for the host's install flow, plus one line on the host
   versions it needs.
6. `## Use it`: the command, its flags (one table), and a first run.
7. `## Phases and gates`: the five ⏸ lines and what the user answers at each.
8. `## Roles`: who plans, reviews, and codes, and which can be delegated.
9. `## Coder configuration`: `.zlak-flow/coder.json` fields, profiles, `extends`, API-key
   environment variables. Point to `packages/core` sources only through the repository URL.
10. Platform-specific sections (for the Harness: where it appears, locale, troubleshooting).
11. `## Package layout`: a tree of the shipped files, marking generated ones.
12. `## Limitations`.
13. `## License`.

The sections that describe the workflow (phases, gates, roles) must agree with
`packages/core/protocol/protocol.md`; link to behavior, never paste the protocol.

### maintainer layout (`core`)

H1 `Plugin Flow Core`, switcher + cover, lead (what the package is and that it never ships), Note,
`## What lives here` (source → generated table), `## Placeholders`, `## Workflow`
(edit, sync, check), `## Adding a platform`, `## Not generated`, `## License`.

### custom layout

If a unit fits none of the above, document its order at the top of that unit README and keep it
identical across languages. Do not mix layout orders inside one repo without a stated reason.

## 4. Table rules

- Flags use `| Flag | Argument | Default | Description |`; `coder.json` fields use
  `| Field | Type | Default | Description |`. Keep one header per kind across the repo.
- Types in backticks; escape unions as `\|`; no default is `—`; required is `**required**`.
- One table per concept (flags, profile fields, files); never merge. Directly under a table,
  add one or two sentences on consequences (what is written where, what is refused).
- Defaults must match `packages/core/config/coder.example.json` and the protocol. Verify
  against the source, never from memory.

## 5. Code block rules

- Use the correct fence: `bash`, `json`, `js`, `text`.
- Keep examples minimal and runnable. Reuse one sample across primitives when possible.
- Imports use the real package name; no hypothetical code.
- Rewrite behavior in each platform's idiom (a Claude Code skill invocation vs a Harness slash
  command); never copy a block across platforms.
- Code blocks are identical across translations; the checker may enforce this.

## 6. Link and image rules

- All cross-links and images use absolute URLs (`<base>/...`) because READMEs render on npm too.
- Append `?raw=true` to images when the profile or host repo requires raw GitHub content.
- Deep anchors use `<absolute-file-url>#section-slug`.
- The language switcher lists every configured language in order and points at the right file.
- Never link to local paths, `docs/`, or in-progress branches.

## 7. Voice

Second person, present tense, declarative, short sentences. No marketing, no emoji. Paragraphs
are at most three sentences, then code or a table. State the reason right after the behavior.
Technical terms (commands, flags, file names, JSON keys, gate names) are never translated.

## 8. Porting checklist (copying this skill to another repo)

1. Replace every value in [Profile](#0-profile); move repo-specific facts out of the rules.
2. Choose languages: delete unused `README_<LANG>.md` rows, update the switcher and the checker.
3. Map each unit to a layout in [section 3](#3-unit-readme-layout-profiles); delete unused
   layouts.
4. Delete optional root sections the target repo does not have (Examples, playground,
   benchmarks). Link user-facing `skills/*` integration files from the root and unit READMEs,
   never the internal `.agents/skills` files.
5. Point the pre-flight checker to the host command, or remove that checklist item.
6. Remove the architecture-skill reference if the host repo has no such skill.
7. Search for leftover source-repo names (the source org, the source project name, old package names) after
   copying.

## 9. Pre-flight checklist

- [ ] Root README has no flag or configuration tables.
- [ ] Every unit README stands alone (tagline, Note, Install).
- [ ] Units of the same layout share section order.
- [ ] Every heading, table shape, and code block matches across translations.
- [ ] No relative links; no `TODO`.
- [ ] H1 equals the package/unit name.
- [ ] Defaults and peer ranges match the code and manifest.
- [ ] The language switcher resolves for every configured language.
- [ ] The checker command passes, if one is configured.
