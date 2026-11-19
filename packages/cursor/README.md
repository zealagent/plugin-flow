# zlak-flow for Cursor

[English](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/cursor/README.md) | [Tiếng Việt](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/cursor/README_VI.md) | [中文](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/cursor/README_CN.md)

![Zealakit Agent Plugin Flow cover](https://github.com/zealakit/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

A PM/Reviewer build workflow with a human approval gate at every step, as a Cursor plugin: the `/zlak-flow` command in Agent chat, with two read-only subagents. Plan and Review can run in the current session or in those subagents.

The coder can be a Harness MCP server, a nested Cursor CLI run, or any CLI. The session itself never edits code. Nothing is pinned to a vendor.

```text
Phase 0 Adopt ─▶ GATE 0 ─▶ Phase 1 BRD ─▶ GATE 1 ─▶ Phase 2 Plan ─▶ GATE 2
       ─▶ Phase 3 Execute ─▶ Phase 4 Review ─▶ GATE 3 ─▶ Phase 5 Commit
```

> **Note**
> Plugin Flow runs a PM/Reviewer workflow with a human approval gate at every step: BRD, Plan, delegated coding, Review, Commit. It never skips a gate and never stores an API key; it names the environment variable that holds one.
>
> It is not a coding model or an agent runtime. The coder is whatever model or CLI you configure in `.zlak-flow/coder.json`.

## Install

The package installs as a Cursor plugin in the local plugin directory:

```bash
cd packages/cursor
node install.mjs                       # the plugin: ~/.cursor/plugins/local/zlak-flow
node install.mjs --project <dir>       # also the agents in <dir>/.cursor/agents
```

It never overwrites a changed file without `--force`, skips files that are already current, and `--dry-run` shows what it would do. `--target <dir>` picks another plugin directory. Reload the Cursor window, then run `/zlak-flow <task>` in Agent chat. The documentation lists only `name` and `description` for a plugin's agents, while the `readonly` key is documented for subagent definitions in `.cursor/agents`, so install with `--project` to get the read-only guarantee. Do not edit this repository's own `.cursor` folder: it is a symlink to the maintainers' `.agents` guidance and has nothing to do with the plugin.

## Use it

```text
/zlak-flow Add pagination to GET /orders, 100 rows max, with unit tests.
```

Phase 1 writes the BRD and stops at GATE 1. Answer each gate in the conversation:

```text
approve BRD
approve plan
approve review, commit
reject <reason>
```

| Flag | Argument | Default | Description |
| --- | --- | --- | --- |
| `--setup` | — | — | Write or refresh `coder.json`. It asks you for each provider's protocol, endpoint and key variable name, and writes it straight away. It also adds `.zlak-flow/` to your `.gitignore` when it isn't ignored yet. |
| `--approve-all` | — | — | Approve GATE 1, 2 and 3 up front. It still stops on a failed part, a review that is not OK, an unresolved model or an unclear BRD. It never commits or pushes: you say when to commit. |
| `--planner` | `<use>` | `roles.planner.use`, else `self` | Who writes the plan. |
| `--reviewer` | `<use>` | `roles.reviewer.use`, else `self` | Who reviews. |
| `--coder` | `model:<profile>[/<alias>]` | `active` in `coder.json` | Coder profile for this run, with an optional model alias from that profile. |
| `--adopt` | `[path]` | — | Take over a project that already has plans, a BRD or code. |
| `--resume` | `<task-id>` | — | Continue an interrupted run from its state file. |
| `--from` | `<brd\|plan\|execute\|review>` | — | Start at that phase when the earlier artifacts exist. |

`--from` never skips an approval: `plan` needs GATE 1, `execute` needs GATE 1 and 2, and `review` also needs executed parts. A gate that isn't recorded in the state file `.zlak-flow/state/<task-id>.json` is presented again, and the run stops there. `--resume` counts a part left `running` as failed and continues at the first part that isn't done.

## Phases and gates

| Phase | What happens | Gate |
| --- | --- | --- |
| 0. Adopt | Scan existing plans, BRD and code; label every part with evidence. Read-only outside `.zlak-flow/`. | ⏸ GATE 0 |
| 1. BRD | Goals, scope, requirements, acceptance criteria, risks; names the planner, reviewer and coder. | ⏸ GATE 1 |
| 2. Plan | Numbered plan files under `.zlak-flow/plans/<task-id>/`, each small enough for one coder run. | ⏸ GATE 2 |
| 3. Execute | One part at a time, tests after each; no commits. | ⏸ PART FAILED, only on a failure |
| 4. Review | The real diff, one pass per part, every finding with file and line. | ⏸ GATE 3 |
| 5. Commit | One commit of this run's files. Never a push. | after GATE 3 |

A gate is approved only by a clear approval for that gate. An ambiguous "ok" is asked about again. At GATE 3 answer `approve`, `fix` + instructions, `discard` or `stop`. At PART FAILED answer `retry` (optionally naming another profile or alias), `fix`, `discard` or `stop`. Nothing is reverted unless you answer `discard`.

## Roles

Plan and Review resolve from `--planner` / `--reviewer`, then `roles.<role>.use` in `.zlak-flow/coder.json`, then `self`.

| Value | Meaning |
| --- | --- |
| `self` | This session does the work. Default, most expensive. |
| `subagent` | The `zlak-flow-planner` or `zlak-flow-reviewer` subagent, started by name, with `readonly: true`. |
| `cursor:<model>` | The same subagent, only when its definition already sets `model` to that value. |
| `model:<profile>[/<alias>]` | The Harness `run_role` tool on that `coder.json` profile, read-only. Needs a Harness. |

A delegated planner returns the plan text and this session writes the files. A role whose lane is missing is reported at GATE 1, and `self` is used only if you agree.

## Coder configuration

`coder.json` is optional. To configure a coder, copy [`config/coder.example.json`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/cursor/config/coder.example.json) to `.zlak-flow/coder.json` in your project and fill in the endpoint, model and the **name** of the environment variable that holds the key. The file is the same for every platform of zlak-flow. With no `coder.json` at all, the coder is a nested `agent -p` run.

| Situation | Lane |
| --- | --- |
| A Harness MCP server is connected | The Harness runs every part, for any profile. |
| No `coder.json` and no `--coder` | A nested Cursor CLI run, `agent -p`, without `--force`. |
| Profile `protocol: "command"` | The CLI runs through the terminal with `{model}`, `{prompt_file}`, `{workdir}`, `{branch}`. |
| Profile `protocol: "anthropic"` | Needs a Harness; without one the run stops and says so. |
| Profile `protocol: "openai"` | Needs a Harness; without one the run stops and says so. |

The workflow never switches lanes, profiles or models on its own after a failure.

### Adding a coder

No plugin or skill change is needed: edit `.zlak-flow/coder.json` only.

A new plan tier of an existing provider is a profile that `extends` the existing one and overrides only what differs:

```json
"provider-pro": { "extends": "provider-lite", "api_key_env": "PROVIDER_PRO_API_KEY" }
```

A new model under an existing provider is an alias in that profile's `models` map, used as `/zlak-flow --coder model:<profile>/<alias> <task>`. A new provider is a profile with a `protocol`:

| Protocol | Use when | How zlak-flow runs it without a Harness |
| --- | --- | --- |
| `anthropic` | The endpoint speaks the Anthropic messages API. | It doesn't: this lane needs a Harness. |
| `openai` | An OpenAI-compatible chat endpoint. | It doesn't: this lane needs a Harness that runs its own tool loop. |
| `command` | Any other CLI agent or your own script. | Runs `command` with `{model}`, `{prompt_file}`, `{workdir}`, `{branch}` substituted and env from `env`. |

### Harness contract

A Harness is an MCP server that runs coder jobs for any profile. When one is connected, zlak-flow uses it first. An adapter must satisfy:

- `submit_task(plan_file, coder, model_alias, context_summary)` runs one plan part and returns a `job_id`; work happens on branch `<branch_prefix><task-id>`. It refuses a new job while another runs (`limits.max_concurrent_jobs`, default 1) and refuses prompts above `limits.job_prompt_max_chars`.
- It enforces `limits.job_memory_limit_mb` and `timeout_seconds` on the coder process, kills the job on breach and reports `failed` with reason `memory_limit` or a timeout.
- `get_status(job_id)` returns `queued | running | done | failed` plus a short summary.
- `get_result(job_id)` returns changed files, the part's diff, the Harness's own test results (not the coder's claims), and a log file path.
- `run_role(role, coder, model_alias, prompt_file)` runs a read-only planner or reviewer prompt on any configured coder and returns its text. It must not allow file writes or git writes.
- The Harness never commits, never pushes, and never reads or returns API keys.

For adopted work, `submit_task` receives in `context_summary` the status of the part (`not_started` or `partial`), what already exists for a `partial` part, and the project's detected test command. The Harness runs only that part's tests plus the existing test command, and does not touch files outside the part's declared scope.

## Package layout

```text
packages/cursor/
├── .cursor-plugin/plugin.json         plugin manifest: name zlak-flow, version
├── commands/zlak-flow.md              the /zlak-flow command: protocol + run input (generated)
├── agents/zlak-flow-planner.md        readonly subagent
├── agents/zlak-flow-reviewer.md       readonly subagent
├── config/coder.example.json          starter project configuration (generated)
├── install.mjs                        copies the plugin into Cursor's local plugin directory
├── tests/plugin.test.mjs              offline checks (pnpm test), not shipped
└── README.md                          this document
```

`SKILL.md` and `config/coder.example.json` are generated from [`packages/core`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/core/README.md): edit the protocol and the Cursor fragments there and run `pnpm sync` at the repository root. `pnpm check` confirms the generated files are current, the manifest is well formed, the planner and reviewer are `readonly`, and `install.mjs` installs and refuses as described.

## Limitations

- Gates hold because the model follows the protocol. No hook enforces them, and Cursor's agent may keep working between turns, so read the gate lines as the contract and reject explicitly. The documentation does not say whether it pauses at a gate: only a manual run in the Cursor chat proves it, and that has not been done.
- `coder.json` is a convention, not a validated schema. A typo shows up as a coder failure, not as a validation error.
- The documentation gives no argument placeholder for commands, so the command reads the text you type after `/zlak-flow`, and it does not state where plain command files live, so the package ships as a plugin. The nested lane needs the `agent` CLI on `PATH`; the prompt cannot forbid a commit, so the workflow checks `git log` afterwards. Runtime memory limits are only enforced when a Harness runs the coder.
- Not yet run in a live Cursor session: the format was checked against the Cursor documentation only, and no Cursor version is recorded here. Without subagents, Plan and Review cost the full session model.
- Only Phase 5 commits, and the workflow never pushes.

## License

MIT © Zealakit. Written by nqhed - Huy Ed. Nguyen.
