# Plugin Flow Core

[English](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/core/README_CN.md)

![Zealakit Agent Plugin Flow cover](https://github.com/zealakit/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

The single source for everything the zlak-flow platforms share. Nothing here
ships: each platform plugin must stay self-contained when installed, so
`pnpm sync` writes generated copies into the platform folders, and
`pnpm check` fails when any copy is stale.

> **Note**
> Plugin Flow runs a PM/Reviewer workflow with a human approval gate at every step: BRD, Plan, delegated coding, Review, Commit. It never skips a gate and never stores an API key; it names the environment variable that holds one.
>
> It is not a coding model or an agent runtime. The coder is whatever model or CLI you configure in `.zlak-flow/coder.json`.

## What lives here

| Source | Generated into |
|---|---|
| `protocol/protocol.md`: the workflow protocol (phases, gates, state file, coder resolution, flags, hard rules) | `packages/claude/skills/zlak-flow/SKILL.md` (with the skill frontmatter and `$ARGUMENTS`), `packages/dsh/protocol.js` (`PROTOCOL`) |
| `protocol/usage.txt`: the one usage line | Both protocols, the skill's `argument-hint`, and `USAGE` in `packages/dsh/protocol.js` |
| `platforms/<platform>/*.md`: what differs per platform | Spliced into that platform's protocol |
| `platforms/claude/skill-header.md`: the skill frontmatter | The top of `SKILL.md` |
| `config/coder.example.json`: the `coder.json` template | `packages/claude/config/`, `packages/dsh/config/`, and the `CODER_TEMPLATE` block in `packages/dsh/client.js` |
| `icon.svg`: the icon | `packages/dsh/icon.svg` |

## Placeholders

`protocol.md` holds `{{name}}` placeholders. `{{usage}}` is the usage line;
any other name is the file `platforms/<platform>/<name>.md`, trimmed. Every
platform must have every fragment the protocol uses; an empty file is allowed
and removes the placeholder.

| Fragment | Holds |
|---|---|
| `preamble` | Platform notes right after the usage line (Claude: the empty-input rule). |
| `roles` | The role values a platform can delegate Plan and Review to. |
| `coder-mechanisms` | How a platform runs the coder, including the "session default". |

## Workflow

1. Edit the source here, never the generated copy. Generated files say so in
   their first lines.
2. Run `pnpm sync` at the repository root.
3. Run `pnpm check`. It covers, in order:
   - every generated file matches its source (`pnpm sync:check`)
   - `pnpm typecheck`, `pnpm test` and `pnpm lint`
   - `pnpm check:parity`: every shipped protocol has the same five ⏸ gate
     lines, word for word

## Adding a platform

1. Create `platforms/<platform>/` with one `.md` per placeholder.
2. Add the platform's outputs to the `outputs` list in `scripts/sync.mjs`.
3. Run `pnpm sync`, then `pnpm check`.

## Not generated

- The Claude plugin's `.claude-plugin/icon.png` is rendered from `icon.svg` by
  hand (the validator wants a 512 px PNG), because rendering SVG has no portable
  Node tool. Re-render it when the icon changes.
- Each platform's README and its UI text, such as the DeepSeek Harness page
  dictionaries, describe the platform in its own words and stay in its folder.

## License

MIT © Zealakit
