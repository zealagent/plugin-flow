# zla-flow for DeepSeek Harness

[English](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/README.md) | [Tiếng Việt](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/README_VI.md) | [中文](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/README_CN.md)

![Zealamic Plugin Flow cover](https://github.com/zealamic/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

每一步都有人工审批关卡的 PM/Reviewer 构建工作流，以左侧边栏页面加 `/zla-flow` 命令的形式引入 DSH。Plan 和 Review 可以在当前会话中运行，也可以委派给更便宜或不同的模型；coder 可以是此 profile 能访问的任何提供商、任何模型或任何 CLI。没有任何内容绑定到特定供应商。

```text
Phase 0 Adopt ─▶ GATE 0 ─▶ Phase 1 BRD ─▶ GATE 1 ─▶ Phase 2 Plan ─▶ GATE 2
       ─▶ Phase 3 Execute ─▶ Phase 4 Review ─▶ GATE 3 ─▶ Phase 5 Commit
```

> **Note**
> Plugin Flow 运行 PM/Reviewer 工作流，每一步都有人工审批关卡：BRD、Plan、委派编码、Review、Commit。它从不跳过关卡，也从不保存 API key；它只记录存放 key 的环境变量名称。
>
> 它不是编码模型，也不是 agent 运行时。coder 是你在 `.zla-flow/coder.json` 中配置的模型或 CLI。

## Install

在 Settings → Plugins 中启用 `@zealamic/agent-plugin-flow-dsh` bundle，然后刷新页面。之后 `/zla-flow` 命令和侧边栏入口就会出现。

## What it adds

- **左侧边栏入口**：名为 `zla-flow`，在主栏中打开一个完整页面。
- **页面**：带有可选 coder profile 和模型别名的任务输入框、把命令送入新会话的按钮、可复制的命令行、可复制的 `coder.json` 模板，以及关于阶段、关卡、角色、flag、限制和文件布局的参考。
- **`/zla-flow` 命令**：把完整协议展开到对话中并开始一轮，因此之后的每个关卡都只是你要回答的普通消息。

## Where it appears

| Surface | What it is |
|---|---|
| Sidebar | `zla-flow` 图标，位于 Plugins 和 Schedules 之后。点击会打开该页面。 |
| Main column | `zla-flow` 页面，键为 `zla-flow`：上方是启动控件，下方是参考内容。 |
| Composer | `/zla-flow [flags] <task>`，可在任何会话中使用。 |

## Use it

1. 点击左侧边栏中的 `zla-flow`。
2. 输入任务，例如 `Add pagination to GET /orders, 100 rows max, with unit tests.`
3. 可选：仅为本次运行设置 coder profile 和模型别名。
4. 点击 **Start in a new session**。会打开一个新会话，输入框中已经填好 `/zla-flow <你的 flag> <你的任务>`。
5. 在那里按 Enter。Phase 1（BRD）运行并停在 GATE 1。
6. 在对话中回答每个关卡：

```text
approve BRD
approve plan
approve review, commit
reject <reason>
```

直接输入命令是等价的：`/zla-flow --coder model:default/fast Add pagination to GET /orders`。

## Phases and gates

| Phase | What happens | Gate |
|---|---|---|
| 0. Adopt | 扫描已有的计划、BRD 和代码；为每个部分标注并给出证据。在 `.zla-flow/` 之外只读。 | ⏸ GATE 0 |
| 1. BRD | 目标、范围、范围之外、需求、验收标准、风险。 | ⏸ GATE 1 |
| 2. Plan | 带编号的计划文件，每个都小到足以让 coder 一次运行完成。 | ⏸ GATE 2 |
| 3. Execute | 一次一个部分，按索引顺序；遇到第一个失败就停止。不提交。 | ⏸ PART FAILED，仅在失败时 |
| 4. Review | 阅读真实的 diff，每个部分一轮，每条发现都带文件和行号。 | ⏸ GATE 3 |
| 5. Commit | 一次 `git commit`，附清晰的提交信息；报告哈希值。绝不 push。 | GATE 3 之后 |

只有对**该**关卡的明确批准才算通过。含糊的“ok”或“继续”会被再次询问，而不是被猜测。拒绝会让运行停在该阶段，直到你给出新的方向。

Phase 3 在同一轮中直接进入 Phase 4；其他每个阶段各占一轮。在第一个部分之前，Phase 3 会检查工作区是否干净，设置了前缀时切换到 `<branch_prefix><task-id>`，并解析 coder。每个部分之后都会运行测试命令，测试失败会让运行停止。

### Answering GATE 3

| Answer | What happens |
|---|---|
| `approve` | Phase 5 只提交本次运行修改过的文件。 |
| `fix` + 说明 | 保留 coder 的修改。写出新的 `NN-fix-<slug>.md` 单元并在 GATE 2 展示；批准后，只执行并 review 这些单元。 |
| `discard` | 恰好回滚状态文件中列出的文件，显示回滚了什么，然后停止。 |
| `stop` / `reject` | 保持工作区不变，并总结尚未提交的内容。 |

除非你回答 `discard`，否则不会回滚、重置或暂存任何内容。

### Answering PART FAILED

当 coder 的某个部分失败、测试失败或超出限制时，Phase 3 会把该部分标记为失败，跳过 Phase 4，并停在 `⏸ PART FAILED`。

| Answer | What happens |
|---|---|
| `retry` [profile 或别名] | 用相同的 coder 或你指定的 coder 再运行一次失败的部分，然后继续其余部分。 |
| `fix` + 说明 | 写出一个 `NN-fix-<slug>.md` 单元并在 GATE 2 展示；批准后，它和其余部分一起运行，然后进入 Phase 4。 |
| `discard` | 与 GATE 3 相同。 |
| `stop` | 与 GATE 3 相同；之后的 `--resume` 会从失败的部分继续。 |

## Roles and cost control

Plan 和 Review 是成本最高的步骤。每个角色先取 flag，再取 `coder.json` 中的 `roles.<role>.use`，最后取 `self`。

| Value | Meaning |
|---|---|
| `self` | 由本会话完成。默认值，成本最高。 |
| `subagent` | 使用该 profile 默认模型的只读 subagent。 |
| `subagent:<provider>/<model>` | 使用明确指定的提供商和模型的只读 subagent，例如 `subagent:openai/gpt-5.1` 或 `subagent:deepseek/deepseek-chat`。该 profile 拥有的任何提供商都可以使用。 |
| `model:<profile>[/<alias>]` | 使用某个 `coder.json` profile 的提供商和模型的只读 subagent，可附带别名。只限 `anthropic`、`openai` 或 `host` profile：`command` profile 会编辑文件，因此不能担任角色。 |

被委派的角色是只读的：不得编辑文件、写 git 或提交。planner 和 reviewer 会在 GATE 1 点名，reviewer 在 GATE 2 再次点名，以便你在产生任何成本之前更改。

## Coder mechanisms

Phase 3 把一个计划部分交给 coder 并等待。工作流使用该 profile 实际提供的第一个机制，当一个都没有时会给出明确的信息并停止：

1. **一个能编辑文件的 subagent**，以 coder profile 的提供商和模型启动。这是 DSH 中的默认 lane。
2. **一个 MCP coder 服务器**，在有已连接的服务器时使用。
3. **一个 CLI coder**，来自 profile 的 `protocol: "command"`。

失败之后，它绝不会自行用一种机制替换另一种：它会报告失败、列出替代方案并等待。

## Coder configuration

`coder.json` 是可选的。没有它，也没有 `--coder` 时，coder 是会话默认值：本会话默认模型上一个能编辑文件的 subagent，否则是已连接的 MCP coder。CLI coder 总是需要一个 profile。

若要使用本应用已有的提供商，而不必填写端点或密钥，请在安装后运行一次 `/zla-flow --setup`。它会读取应用的提供商和模型，直接写入 `.zla-flow/coder.json`，无需批准，并且不会删除任何 profile。若 `.zla-flow/` 尚未被忽略，它还会将其加入项目的 `.gitignore`，使工作流文件不会进入你的提交。每个提供商会新增一个 `host` profile；你自己写的 profile，以及 `roles`、`workspace` 和 `limits` 都不会被改动。新增提供商后再次运行即可；当应用有 `coder.json` 中没有的提供商时，GATE 1 也会提示。

无法解析的 coder（缺少 profile 或别名、`extends` 链断裂）绝不会阻塞 BRD 或 Plan：GATE 1 和 GATE 2 会把它显示为“unresolved”并说明原因，以便你及时修复。只有 Phase 3 会因它而停止。

在项目中创建 `.zla-flow/coder.json`。页面上的 **Copy coder.json template** 按钮会复制一个起始文件；同一个文件以 [`config/coder.example.json`](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/config/coder.example.json) 的形式发布。它是工作流读取的约定，而不是 DSH 会校验的文件。

```jsonc
{
  "version": 6,
  "active": "default",            // default coder profile
  "fallback": [],                 // a menu, never an automatic switch
  "coders": {
    "default": {
      "protocol": "openai",       // anthropic | openai | command
      "base_url": "https://…",
      "api_key_env": "CODER_API_KEY",  // the NAME of an env var, never the key
      "model": "default",         // default alias
      "models": { "default": "…" },    // short alias → real model id
      "temperature": 0.2,
      "max_tokens": 8192,
      "timeout_seconds": 900
    }
  }
}
```

### Transport lanes

| Protocol | Use it when | Fields that matter |
|---|---|---|
| `anthropic` | 提供商使用 Anthropic messages API，无论是直接使用还是通过代理。 | `base_url`, `api_key_env`, `model`, `models` |
| `openai` | 提供商使用 OpenAI 聊天 API：托管 API、网关、vLLM、Ollama、LM Studio。 | `base_url`, `api_key_env`, `model`, `models`, `temperature`, `max_tokens` |
| `command` | 机器上的任何 CLI：供应商 CLI、agent CLI，或你自己的脚本。 | `command`, `env`, `model`, `models`, `timeout_seconds` |
| `host` | 本应用已有的提供商，由 `--setup` 写入：没有 `base_url`，也没有密钥。 | `provider`, `model`, `models`, `generated` |

`command` profile 的占位符是 `{model}`、`{prompt_file}`、`{workdir}` 和 `{branch}`。该命令必须编辑 `{workdir}` 中的文件，成功时以 0 退出。

命令从项目根目录运行，并使用该 profile 的 `env`。prompt 文件写在 `.zla-flow/state/` 下，`timeout_seconds` 限制运行时间。

### Profile inheritance

一个 profile 可以 `extends` 另一个并只覆盖不同之处，因此同一提供商的两个套餐共用端点，只在 key 或模型上不同。运行时按字段合并整条链，子覆盖父；`models` 映射按键合并。出现循环或缺少父级会使运行停止。

### Keys

文件中只应出现环境变量的**名称**。工作流从不索要 key，从不打印 key，也从不把 key 放进计划或提交。请在启动 DSH 的环境中设置该变量。

## `coder.json` reference

| Field | Meaning |
|---|---|
| `version` | 此文件的格式版本。 |
| `active` | 未指定 `--coder` 的运行所用的默认 profile。 |
| `fallback` | 当前 profile 失败时提供的候选 profile。从不静默使用。 |
| `coders.<name>` | 一个 profile：`protocol`、`base_url`、`api_key_env`、`model`、`models`、`timeout_seconds`，以及可选的 `extends`、`temperature`、`max_tokens`、`command`、`env`。 |
| `workspace.branch_prefix` | coder 分支的前缀，在机制使用分支时生效。 |
| `workspace.test_command` | 项目真实的测试命令，自动发现或明确给出。 |
| `roles.planner.use` | 由谁编写计划。 |
| `roles.reviewer.use` | 由谁 review。 |
| `roles.reviewer.verify_high_severity` | 被委派时，在本会话中重新打开每一条高严重度的发现。默认 `true`。 |
| `limits` | 大小和运行时预算，见下文。 |
| `adopt` | Phase 0 的搜索路径和上下文文件。 |

## Size and runtime limits

| Field | Default | What it bounds |
|---|---|---|
| `plan_max_lines` | 120 | 每个计划文件的行数。 |
| `plan_max_steps` | 8 | 每个计划文件的步骤数。 |
| `plan_max_files_touched` | 6 | 一个计划部分可以改动的文件数。 |
| `review_max_diff_lines` | 600 | 每轮 review 的 diff 行数。 |
| `max_concurrent_jobs` | 1 | 同时运行的 coder 任务数。 |
| `job_prompt_max_chars` | 24000 | 交给一个 coder 任务的字符数。 |
| `job_memory_limit_mb` | 4096 | 一个 coder 任务所假定的内存预算。 |

工作流会拆分计划文件以保持在这些限制之内。内存和并发的真正执行属于运行 coder 的宿主，而不是此页面。

超出限制的计划文件会被拆分为 `NN-<slug>-01.md`、`NN-<slug>-02.md` 等，沿模块或层的边界拆分，绝不在步骤中间切开，并且每个部分都列在索引中。

## Where things live

| Path | Purpose |
|---|---|
| `.zla-flow/coder.json` | Profile、角色、限制、接管路径。 |
| `.zla-flow/plans/<task-id>/` | `00-index.md` 加每个工作单元一个文件。 |
| `.zla-flow/state/<task-id>.json` | 当前运行的进度，使 `--resume` 能够继续。 |

工作流从不编辑、移动、重命名或删除你的任何文件；派生文件都放在 `.zla-flow/` 下。

`<task-id>` 是 `YYYYMMDD-<slug>`，从任务中一次性得出，并在第一条回复中说明。状态文件有固定的结构：

```json
{
  "task_id": "20261118-orders-pagination",
  "task": "…",
  "phase": 3,
  "approved_gates": [1, 2],
  "planner": "self",
  "reviewer": "subagent",
  "coder": { "profile": "default", "alias": "default", "model": "…", "mechanism": "subagent" },
  "branch": "task/20261118-orders-pagination",
  "parts": [{ "file": "01-api.md", "status": "done", "changed_files": ["src/orders.ts"], "error": null }],
  "updated_at": "…"
}
```

只有在你于对话中批准某个关卡之后，它才会被列入 `approved_gates`；磁盘上存在文件绝不算作批准。

## Adopting an existing project

`--adopt [path]` 从 Phase 0 开始。这次运行会梳理已有的内容，而不是重做：

1. **发现**该任务已有的计划、BRD、设计文档和代码，以及项目的指引和构建/测试配置、git 状态、分支和最近的历史。
2. **导入但不修改**：派生产物放在 `.zla-flow/` 下，保留你的编号，并把每个原件标为其来源。
3. **基于证据评估**，每个部分一个标签：

| Label | Meaning |
|---|---|
| `done` | 已完成，仓库中有证据。 |
| `partial` | 部分完成；报告会说明缺少什么。 |
| `not_started` | 尚未开始。 |
| `conflict` | 计划与代码不再一致；需要你来决定。 |
| `unclear` | 信息不足以判断；需要你来决定。 |

4. **检查 BRD**：总结它并列出缺口，或者提议编写一份简短的 BRD。
5. **报告并停在 GATE 0。**

复选框不被接受为证据。接管从不自行批准 BRD、计划或 review：这些关卡保持关闭，除非你在 GATE 0 说明并点名要批准哪些。继续执行时只运行 `not_started` 和 `partial` 的部分，对 `partial` 的部分，会准确告诉 coder 已有什么、还剩什么。

当 `adopt.require_clean_tree` 为 true（默认）且工作区有不相关的未提交更改时，运行会报告它们并在执行之前停止。

## Flags

| Flag | Meaning |
|---|---|
| `--setup` | 根据应用的提供商和模型写入或刷新 `coder.json`。 |
| `--approve-all` | 预先批准 GATE 1、2 和 3。遇到失败的部分、未通过的 review、未解析的模型或不清楚的 BRD 时仍会停止。它从不 commit 或 push：由你决定何时 commit。 |
| `--planner <use>` | 由谁编写计划。 |
| `--reviewer <use>` | 由谁 review。 |
| `--coder model:<profile>[/<alias>]` | 本次运行使用的 coder profile，可附带该 profile 内的模型别名。 |
| `--adopt [path]` | 接管一个已经有计划、BRD 或代码的项目。 |
| `--resume <task-id>` | 从状态文件继续一次被中断的运行。 |
| `--from <brd\|plan\|execute\|review>` | 在之前的产物已存在时，从该阶段开始。 |

`--from` 从不跳过审批：`plan` 需要 GATE 1，`execute` 需要 GATE 1 和 2，`review` 还需要已执行的部分。本任务状态文件中没有记录的关卡会被重新提出，运行也会停在那里。`--resume` 会把状态文件与仓库核对，把停留在 `running` 的部分视为失败，并从第一个未完成的部分继续。

## Troubleshooting

| Symptom | Check |
|---|---|
| 侧边栏入口不见了 | Settings → Plugins：`@zealamic/agent-plugin-flow-dsh` bundle 已启用。bundle 变更后，请刷新页面。 |
| 没有提供 `/zla-flow` | Host 部分随进程加载；请切换该插件行的开关或重启 DSH，然后开始一个新会话。 |
| Start 没有打开会话 | 页面会打开当前显示会话的工作区，否则打开最近的工作区。请先打开一个工作区。 |
| Phase 3 立即停止 | 没有 coder lane：请连接一个 MCP coder，或设置一个 `coders.<name>` profile 并把 `active` 指向它。 |
| profile 的模型被拒绝 | `--coder model:<profile>/<alias>` 中的别名必须是该 profile 的 `models` 映射中的一个键。 |

## Package layout

```text
packages/dsh/
├── package.json            bundle manifest (dsh.bundle.patch + dsh.client)
├── cordis.patch.yml        inserts the zla-flow row
├── index.js                Host half: the /zla-flow command
├── protocol.js             the protocol and usage line (generated from packages/core)
├── client.js               Client half: sidebar entry, page, styles
├── config/coder.example.json   starter project configuration (generated)
├── locale/en.json, locale/vi.json   Plugin Manager title and description
├── icon.svg                bundle icon (generated)
├── tests/bundle.test.mjs   offline checks (pnpm test), not shipped
└── README.md               this document
```

`protocol.js`、`config/coder.example.json`、`icon.svg` 以及 `client.js` 中的 `CODER_TEMPLATE` 块由 [`packages/core`](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README.md) 生成：请在那里修改它们，然后在仓库根目录运行 `pnpm sync`。

`pnpm check` 会确认生成的文件是最新的、内嵌的 `coder.json` 模板与 `config/coder.example.json` 一致、EN 和 VI 词典的键一致、页面可以渲染，以及命令处理器行为正确。每次修改后都请运行它。

## Limitations

- 该页面只负责启动并说明这次运行；它不会读取 `.zla-flow` 状态文件，所以进度和待处理的批准都在对话中。
- 关卡之所以有效，是因为模型遵循协议。没有 hook 强制执行，所以请把关卡行当作契约，并明确地拒绝。
- Phase 3 需要上述三种 coder 机制之一。没有时，运行会停在 Phase 3 并指出缺少的机制；它绝不会自己写代码。
- `coder.json` 是一种约定，而不是经过校验的 schema。拼写错误会表现为 coder 失败，而不是校验错误。
- 只有 Phase 5 会提交，而且工作流从不 push。

## License

MIT © Zealamic。作者：nqhed - Huy Ed. Nguyen。

该工作流与 Claude Code 插件运行的是同一个；本包是它的 DeepSeek Harness 移植版。页面提供英文和越南文词典（`locale/en.json`、`locale/vi.json` 以及 Client 词典），因为 DSH 插件会跟随读者当前使用的语言。
