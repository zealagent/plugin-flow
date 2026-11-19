# zlak-flow for OpenCode

[English](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/opencode/README.md) | [Tiếng Việt](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/opencode/README_VI.md) | [中文](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/opencode/README_CN.md)

![Zealakit Agent Plugin Flow cover](https://github.com/zealakit/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

A PM/Reviewer build workflow with a human approval gate at every step, as an OpenCode command: `/zlak-flow`, with three subagents. Plan and Review can run in the current session or in a read-only subagent on a cheaper model.

The coder can be the `zlak-flow-coder` subagent, a Harness MCP server, or any CLI. The read-only agents deny edits and git writes by permission, not only by prompt. Nothing is pinned to a vendor.

```text
Phase 0 Adopt ─▶ GATE 0 ─▶ Phase 1 BRD ─▶ GATE 1 ─▶ Phase 2 Plan ─▶ GATE 2
       ─▶ Phase 3 Execute ─▶ Phase 4 Review ─▶ GATE 3 ─▶ Phase 5 Commit
```

> **Note**
> Plugin Flow runs a PM/Reviewer workflow with a human approval gate at every step: BRD, Plan, delegated coding, Review, Commit. It never skips a gate and never stores an API key; it names the environment variable that holds one.
>
> It is not a coding model or an agent runtime. The coder is whatever model or CLI you configure in `.zlak-flow/coder.json`.

## Install

The package installs a command and three subagents into an OpenCode config directory:

```bash
cd packages/opencode
node install.mjs             # this project only: ./.opencode
node install.mjs --global    # every project of this user: ~/.config/opencode
```

It never overwrites a changed file without `--force`, skips files that are already current, and `--dry-run` shows what it would do. `--target <dir>` picks any config directory. Restart OpenCode, then run `/zlak-flow <task>`. The files go into `commands/` and `agents/`, the directory names the current OpenCode documentation uses.

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
| `subagent` | The read-only `zlak-flow-planner` or `zlak-flow-reviewer` subagent, on the model set in its agent file. |
| `opencode:<provider>/<model>` | The same subagent, only when its agent file already sets `model` to that value. |
| `model:<profile>[/<alias>]` | The Harness `run_role` tool on that `coder.json` profile, read-only. Needs a Harness. |

A delegated planner returns the plan text and this session writes the files. A role whose lane is missing is reported at GATE 1, and `self` is used only if you agree.

## Coder configuration

`coder.json` is optional. To configure a coder, copy [`config/coder.example.json`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/opencode/config/coder.example.json) to `.zlak-flow/coder.json` in your project and fill in the endpoint, model and the **name** of the environment variable that holds the key. The file is the same for every platform of zlak-flow. With no `coder.json` at all, the coder is the `zlak-flow-coder` subagent.

| Situation | Lane |
| --- | --- |
| A Harness MCP server is connected | The Harness runs every part, for any profile. |
| No `coder.json` and no `--coder` | The `zlak-flow-coder` subagent. |
| Profile `protocol: "command"` | The CLI runs through the shell with `{model}`, `{prompt_file}`, `{workdir}`, `{branch}`. |
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
packages/opencode/
├── commands/zlak-flow.md             the /zlak-flow command: protocol + $ARGUMENTS (generated)
├── agents/zlak-flow-planner.md       read-only subagent: edits and shell denied except read-only git
├── agents/zlak-flow-reviewer.md      read-only subagent, same permissions
├── agents/zlak-flow-coder.md         file-editing subagent: git commit and git push denied
├── config/coder.example.json         starter project configuration (generated)
├── install.mjs                       copies commands/ and agents/ into an OpenCode config directory
├── tests/plugin.test.mjs             offline checks (pnpm test), not shipped
└── README.md                         this document
```

`commands/zlak-flow.md` and `config/coder.example.json` are generated from [`packages/core`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/core/README.md): edit the protocol and the OpenCode fragments there and run `pnpm sync` at the repository root. `pnpm check` confirms the generated files are current, the command holds nothing OpenCode would expand, the read-only agents deny edits, and `install.mjs` installs and refuses as described.

## Limitations

- Gates hold because the model follows the protocol. No hook enforces them, so read the gate lines as the contract and reject explicitly.
- `coder.json` is a convention, not a validated schema. A typo shows up as a coder failure, not as a validation error.
- OpenCode documents no escape for `$1`..`$N` or `` !`cmd` `` in a command, so the protocol contains neither and a test keeps it that way. It also documents no per-call model override for a subagent: a role model is the `model` in the agent file. The git deny patterns match `git commit *` and `git push *` only; a variant such as `git -C <dir> commit` is not covered, so the workflow checks `git log` afterwards. Runtime memory limits are only enforced when a Harness runs the coder.
- Not yet run in a live OpenCode session: the layout and the permission keys were checked against the OpenCode documentation only, and no OpenCode version is recorded here. Builds that only read the older singular `command/` and `agent/` directories or the older `tools` and `permission` keys are not supported.
- Only Phase 5 commits, and the workflow never pushes.

## License

MIT © Zealakit. Written by nqhed - Huy Ed. Nguyen.
