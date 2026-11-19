# Zealakit Agent Plugin Flow

[English](https://github.com/zealakit/agent-plugin-flow/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/agent-plugin-flow/blob/main/README_VI.md) | [中文](https://github.com/zealakit/agent-plugin-flow/blob/main/README_CN.md)

![Zealakit Agent Plugin Flow cover](https://github.com/zealakit/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

为你已在使用的 agent 平台提供的 PM/Reviewer 构建工作流，每一步都有人工审批关卡：BRD、Plan、委派编码、Review、Commit。

- **一套协议** — 所有平台使用相同的阶段、关卡和规则，只在一个私有 core 中编写一次。
- **每个平台一个插件** — Claude Code 与 DeepSeek Harness，各自独立完整，并符合所在平台的习惯。
- **任意 coder** — 规划与 review 可在你的会话中运行，也可交给更便宜的模型；coder 可以是你配置的任何提供商、模型或 CLI。

Plugin Flow 从不跳过关卡，从不自己写代码，也从不保存 API key。它是一套工作流，而不是一个模型。

> **Note**
> Plugin Flow 运行 PM/Reviewer 工作流，每一步都有人工审批关卡：BRD、Plan、委派编码、Review、Commit。它从不跳过关卡，也从不保存 API key；它只记录存放 key 的环境变量名称。
>
> 它不是编码模型，也不是 agent 运行时。coder 是你在 `.zlak-flow/coder.json` 中配置的模型或 CLI。

## Platforms

| Platform | Package | Documentation |
| --- | --- | --- |
| Claude Code | `@zealakit/agent-plugin-flow-claude` (plugin `zlak-flow`) | [README](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/claude/README.md) |
| DeepSeek Harness | `@zealakit/agent-plugin-flow-dsh` | [README](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/dsh/README.md) |
| GitHub Copilot | `@zealakit/agent-plugin-flow-copilot` (skill `zlak-flow`) | [README](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/copilot/README.md) |
| Cursor | `@zealakit/agent-plugin-flow-cursor` (plugin `zlak-flow`) | [README](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/cursor/README.md) |
| OpenCode | `@zealakit/agent-plugin-flow-opencode` (command `zlak-flow`) | [README](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/opencode/README.md) |
| Gemini CLI | `@zealakit/agent-plugin-flow-gemini` (extension `zlak-flow`) | [README](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/gemini/README.md) |
| Codex CLI | `@zealakit/agent-plugin-flow-codex` (skill `zlak-flow`) | [README](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/codex/README.md) |

每个平台插件都独立完整，可单独安装。除 Codex CLI 通过 `$zlak-flow` 运行外，所有平台都通过 `/zlak-flow` 运行。

## Installation

```text
Claude Code:      /plugin marketplace add zealakit/agent-plugin-flow
                  /plugin install zlak-flow@zealakit
DeepSeek Harness: enable @zealakit/agent-plugin-flow-dsh in Settings → Plugins
Codex CLI:        cd packages/codex && ./install.sh
Gemini CLI:       gemini extensions install ./packages/gemini
OpenCode:         cd packages/opencode && node install.mjs
GitHub Copilot:   cd packages/copilot && node install.mjs
Cursor:           cd packages/cursor && node install.mjs
```

## License

MIT © Zealakit
