# Plugin Flow Core

[English](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README_CN.md)

![Zealamic Plugin Flow cover](https://github.com/zealamic/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

zla-flow 各平台共用内容的唯一来源。这里的任何内容都不会发布：每个平台插件在安装后都必须自包含，因此 `pnpm sync` 会把生成的副本写入各平台目录，而 `pnpm check` 会在任何副本过期时失败。

> **Note**
> Plugin Flow 运行 PM/Reviewer 工作流，每一步都有人工审批关卡：BRD、Plan、委派编码、Review、Commit。它从不跳过关卡，也从不保存 API key；它只记录存放 key 的环境变量名称。
>
> 它不是编码模型，也不是 agent 运行时。coder 是你在 `.zla-flow/coder.json` 中配置的模型或 CLI。

## What lives here

| Source | Generated into |
|---|---|
| `protocol/protocol.md`：工作流协议（阶段、关卡、状态文件、coder 解析、flag、硬性规则） | `packages/claude/skills/zla-flow/SKILL.md`（含 skill frontmatter 与 `$ARGUMENTS`）、`packages/dsh/protocol.js`（`PROTOCOL`） |
| `protocol/usage.txt`：唯一的 usage 行 | 两个协议、skill 的 `argument-hint`，以及 `packages/dsh/protocol.js` 中的 `USAGE` |
| `platforms/<platform>/*.md`：各平台不同的部分 | 拼接进该平台的协议 |
| `platforms/claude/skill-header.md`：skill 的 frontmatter | `SKILL.md` 的开头 |
| `config/coder.example.json`：`coder.json` 模板 | `packages/claude/config/`、`packages/dsh/config/`，以及 `packages/dsh/client.js` 中的 `CODER_TEMPLATE` 块 |
| `icon.svg`：图标 | `packages/dsh/icon.svg` |

## Placeholders

`protocol.md` 包含 `{{name}}` 占位符。`{{usage}}` 是 usage 行；其他名称对应文件 `platforms/<platform>/<name>.md`，并去除首尾空白。每个平台都必须拥有协议用到的所有 fragment；允许空文件，空文件会移除占位符。

| Fragment | Holds |
|---|---|
| `preamble` | 紧跟 usage 行之后的平台说明（Claude：空输入规则）。 |
| `roles` | 平台可以把 Plan 和 Review 委派给的角色取值。 |
| `coder-mechanisms` | 平台如何运行 coder，包括“session default”。 |

## Workflow

1. 在这里修改源文件，绝不要修改生成的副本。生成的文件在开头几行有此说明。
2. 在仓库根目录运行 `pnpm sync`。
3. 运行 `pnpm check`。它按顺序检查：
   - 每个生成的文件都与其源文件一致（`pnpm sync:check`）
   - `pnpm typecheck`、`pnpm test` 和 `pnpm lint`
   - `pnpm check:parity`：每个已发布的协议都有完全相同的五行 ⏸ 关卡，逐字一致

## Adding a platform

1. 创建 `platforms/<platform>/`，为每个占位符提供一个 `.md` 文件。
2. 把该平台的输出加入 `scripts/sync.mjs` 中的 `outputs` 列表。
3. 运行 `pnpm sync`，然后运行 `pnpm check`。

## Not generated

- Claude 插件的 `.claude-plugin/icon.png` 由 `icon.svg` 手动渲染（校验器要求 512 px 的 PNG），因为没有可移植的 Node 工具能渲染 SVG。图标变更时请重新渲染。
- 各平台的 README 及其界面文本（例如 DeepSeek Harness 页面的词典）用自己的话描述该平台，并保留在各自的目录中。

## License

MIT © Zealamic
