# zla-flow for Claude Code

[English](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/claude/README.md) | [Tiếng Việt](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/claude/README_VI.md) | [中文](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/claude/README_CN.md)

![Zealamic Plugin Flow cover](https://github.com/zealamic/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

每一步都有人工审批关卡的 PM/Reviewer 构建工作流，以 Claude Code 插件的形式提供：`/zla-flow` skill。Plan 和 Review 可以在当前会话中运行，也可以交给更便宜的 Claude 模型。

coder 可以是本会话的 subagent、Harness MCP 服务器、任何兼容 Anthropic 的端点，或任何 CLI。没有任何内容绑定到特定供应商。

```text
Phase 0 Adopt ─▶ GATE 0 ─▶ Phase 1 BRD ─▶ GATE 1 ─▶ Phase 2 Plan ─▶ GATE 2
       ─▶ Phase 3 Execute ─▶ Phase 4 Review ─▶ GATE 3 ─▶ Phase 5 Commit
```

> **Note**
> Plugin Flow 运行 PM/Reviewer 工作流，每一步都有人工审批关卡：BRD、Plan、委派编码、Review、Commit。它从不跳过关卡，也从不保存 API key；它只记录存放 key 的环境变量名称。
>
> 它不是编码模型，也不是 agent 运行时。coder 是你在 `.zla-flow/coder.json` 中配置的模型或 CLI。

## Install

通过本仓库中的 marketplace 安装：

```text
/plugin marketplace add zealamic/agent-plugin-flow
/plugin install zla-flow@zealamic
```

或者直接从本地检出加载，仅对当前会话有效：

```bash
claude --plugin-dir packages/claude
```

## Use it

```text
/zla-flow Add pagination to GET /orders, 100 rows max, with unit tests.
```

Phase 1 编写 BRD 并停在 GATE 1。请在对话中回答每个关卡：

```text
approve BRD
approve plan
approve review, commit
reject <reason>
```

| Flag | Argument | Default | Description |
| --- | --- | --- | --- |
| `--setup` | — | — | 写入或刷新 `coder.json`。它会询问每个提供商的协议、端点和密钥变量名，并直接写入。若 `.zla-flow/` 尚未被忽略，它还会将其加入 `.gitignore`。 |
| `--approve-all` | — | — | 预先批准 GATE 1、2 和 3。遇到失败的部分、未通过的 review、未解析的模型或不清楚的 BRD 时仍会停止。它从不 commit 或 push：由你决定何时 commit。 |
| `--planner` | `<use>` | `roles.planner.use`，否则 `self` | 由谁编写计划。 |
| `--reviewer` | `<use>` | `roles.reviewer.use`，否则 `self` | 由谁 review。 |
| `--coder` | `model:<profile>[/<alias>]` | `coder.json` 中的 `active` | 本次运行使用的 coder profile，可附带该 profile 内的模型别名。 |
| `--adopt` | `[path]` | — | 接管一个已经有计划、BRD 或代码的项目。 |
| `--resume` | `<task-id>` | — | 从状态文件继续一次被中断的运行。 |
| `--from` | `<brd\|plan\|execute\|review>` | — | 在之前的产物已存在时，从该阶段开始。 |

`--from` 从不跳过审批：`plan` 需要 GATE 1，`execute` 需要 GATE 1 和 2，`review` 还需要已执行的部分。状态文件 `.zla-flow/state/<task-id>.json` 中没有记录的关卡会被重新提出，运行也会停在那里。`--resume` 把停留在 `running` 的部分视为失败，并从第一个未完成的部分继续。

## Phases and gates

| Phase | What happens | Gate |
| --- | --- | --- |
| 0. Adopt | 扫描已有的计划、BRD 和代码；为每个部分标注并给出证据。在 `.zla-flow/` 之外只读。 | ⏸ GATE 0 |
| 1. BRD | 目标、范围、需求、验收标准、风险；指明 planner、reviewer 和 coder。 | ⏸ GATE 1 |
| 2. Plan | `.zla-flow/plans/<task-id>/` 下带编号的计划文件，每个都小到足以让 coder 一次运行完成。 | ⏸ GATE 2 |
| 3. Execute | 一次一个部分，每个部分之后运行测试；不提交。 | ⏸ PART FAILED，仅在失败时 |
| 4. Review | 真实的 diff，每个部分一轮，每条发现都带文件和行号。 | ⏸ GATE 3 |
| 5. Commit | 一次提交，包含本次运行的文件。绝不 push。 | GATE 3 之后 |

只有对该关卡的明确批准才算通过。含糊的“ok”会被再次询问。在 GATE 3 回答 `approve`、`fix` + 说明、`discard` 或 `stop`。在 PART FAILED 回答 `retry`（可指定另一个 profile 或别名）、`fix`、`discard` 或 `stop`。除非你回答 `discard`，否则不会回滚任何内容。

## Roles

Plan 和 Review 先取 `--planner` / `--reviewer`，再取 `.zla-flow/coder.json` 中的 `roles.<role>.use`，最后取 `self`。

| Value | Meaning |
| --- | --- |
| `self` | 由本会话完成。默认值，成本最高。 |
| `subagent` | 使用会话默认 subagent 模型的只读 subagent。 |
| `claude:<model>` | 使用该模型别名的只读 subagent，例如 `claude:haiku` 或 `claude:sonnet`。 |
| `model:<profile>[/<alias>]` | 在该 `coder.json` profile 上调用 Harness 的 `run_role` 工具，只读。需要 Harness。 |

被委派的 planner 返回计划文本，由本会话写入文件。缺少对应 lane 的角色会在 GATE 1 报告，只有在你同意时才使用 `self`。

## Coder configuration

`coder.json` 是可选的。要配置 coder，请把 [`config/coder.example.json`](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/claude/config/coder.example.json) 复制到项目中的 `.zla-flow/coder.json`，并填写端点、模型以及存放 key 的环境变量的**名称**。该文件在 zla-flow 的所有平台上都相同。完全没有 `coder.json` 时，coder 是当前会话中一个能编辑文件的 subagent。

| Situation | Lane |
| --- | --- |
| 已连接 Harness MCP 服务器 | 由 Harness 运行每个部分，适用于任何 profile。 |
| 没有 `coder.json`，也没有 `--coder` | 本会话中一个能编辑文件的 subagent。 |
| Profile `protocol: "command"` | CLI 通过 Bash 运行，并替换 `{model}`、`{prompt_file}`、`{workdir}`、`{branch}`。 |
| Profile `protocol: "anthropic"` | 针对 `base_url` 以无头方式运行 `claude -p`，key 由 `api_key_env` 传入。 |
| Profile `protocol: "openai"` | 需要 Harness；没有时运行会停止并说明原因。 |

失败之后，工作流绝不会自行切换 lane、profile 或模型。

### Adding a coder

无需修改插件或 skill：只需编辑 `.zla-flow/coder.json`。

现有供应商的新套餐，就是一个 `extends` 现有 profile 并只覆盖不同之处的 profile：

```json
"provider-pro": { "extends": "provider-lite", "api_key_env": "PROVIDER_PRO_API_KEY" }
```

现有供应商下的新模型，是该 profile 的 `models` 映射中的一个别名，用法为 `/zla-flow --coder model:<profile>/<alias> <task>`。新的供应商则是带有 `protocol` 的 profile：

| Protocol | Use when | How zla-flow runs it without a Harness |
| --- | --- | --- |
| `anthropic` | 端点使用 Anthropic messages API。 | 以无头方式运行 `claude -p`，使用 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`（来自 `api_key_env`）和 `ANTHROPIC_MODEL`。 |
| `openai` | 兼容 OpenAI 的聊天端点。 | 无法运行：该 lane 需要自带工具循环的 Harness。 |
| `command` | 任何其他 CLI agent 或你自己的脚本。 | 替换 `{model}`、`{prompt_file}`、`{workdir}`、`{branch}` 后运行 `command`，并使用 `env` 中的环境变量。 |

### Harness contract

Harness 是一个为任意 profile 运行 coder 任务的 MCP 服务器。连接了 Harness 时，zla-flow 优先使用它。适配器必须满足：

- `submit_task(plan_file, coder, model_alias, context_summary)` 运行一个计划部分并返回 `job_id`；工作在分支 `<branch_prefix><task-id>` 上进行。当另一个任务正在运行时（`limits.max_concurrent_jobs`，默认 1）拒绝新任务，并拒绝超过 `limits.job_prompt_max_chars` 的 prompt。
- 对 coder 进程强制执行 `limits.job_memory_limit_mb` 和 `timeout_seconds`，超限时终止任务，并以 `memory_limit` 或超时为原因报告 `failed`。
- `get_status(job_id)` 返回 `queued | running | done | failed` 以及简短摘要。
- `get_result(job_id)` 返回变更的文件、该部分的 diff、Harness 自己的测试结果（而不是 coder 的自述）以及日志文件路径。
- `run_role(role, coder, model_alias, prompt_file)` 在任意已配置的 coder 上运行只读的 planner 或 reviewer prompt 并返回其文本。不得允许写文件或写 git。
- Harness 从不提交、从不 push，也从不读取或返回 API key。

对于接管的工作，`submit_task` 会在 `context_summary` 中收到该部分的状态（`not_started` 或 `partial`）、`partial` 部分已有的内容，以及检测到的项目测试命令。Harness 只运行该部分的测试和现有的测试命令，并且不会改动该部分声明范围之外的文件。

## Package layout

```text
packages/claude/
├── .claude-plugin/plugin.json   plugin manifest (icon.png beside it)
├── skills/zla-flow/SKILL.md     the workflow protocol (/zla-flow, generated)
├── config/coder.example.json    starter project configuration (generated)
├── tests/plugin.test.mjs        offline checks (pnpm test), not shipped
└── README.md                    this document
```

`SKILL.md` 和 `config/coder.example.json` 由 [`packages/core`](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README.md) 生成：请在那里修改协议和 Claude 的 fragment，然后在仓库根目录运行 `pnpm sync`。`pnpm check` 会确认生成的文件是最新的、manifest 和 skill 格式正确，并且根目录的 marketplace 指向这里。

## Limitations

- 关卡之所以有效，是因为模型遵循协议。没有 hook 强制执行，所以请把关卡行当作契约，并明确地拒绝。
- `coder.json` 是一种约定，而不是经过校验的 schema。拼写错误会表现为 coder 失败，而不是校验错误。
- `anthropic` lane 需要 `PATH` 中有 `claude` CLI。只有由 Harness 运行 coder 时，才会强制执行运行时内存限制。
- 只有 Phase 5 会提交，而且工作流从不 push。

## License

MIT © Zealamic。作者：nqhed - Huy Ed. Nguyen。
