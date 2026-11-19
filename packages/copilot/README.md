# zlak-flow for GitHub Copilot

[English](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/copilot/README.md) | [Tiếng Việt](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/copilot/README_VI.md) | [中文](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/copilot/README_CN.md)

![Zealakit Agent Plugin Flow cover](https://github.com/zealakit/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

A PM/Reviewer build workflow with a human approval gate at every step, as a GitHub Copilot skill: `/zlak-flow`, with a read-only custom agent. Plan and Review can run in the current session or in that agent.

The coder can be a Harness MCP server, a nested Copilot CLI run, or any CLI. Copilot has no file-editing subagent this workflow relies on, so the nested run starts a full agent run. Nothing is pinned to a vendor.

```text
Phase 0 Adopt ─▶ GATE 0 ─▶ Phase 1 BRD ─▶ GATE 1 ─▶ Phase 2 Plan ─▶ GATE 2
       ─▶ Phase 3 Execute ─▶ Phase 4 Review ─▶ GATE 3 ─▶ Phase 5 Commit
```

> **Note**
> Plugin Flow runs a PM/Reviewer workflow with a human approval gate at every step: BRD, Plan, delegated coding, Review, Commit. It never skips a gate and never stores an API key; it names the environment variable that holds one.
>
> It is not a coding model or an agent runtime. The coder is whatever model or CLI you configure in `.zlak-flow/coder.json`.

## Install

The package installs a skill and a custom agent into a Copilot customization directory:

```bash
cd packages/copilot
node install.mjs           # this repository: ./.github (commit it to share it)
node install.mjs --user    # every project of this user: ~/.copilot
```

It never overwrites a changed file without `--force`, skips files that are already current, and `--dry-run` shows what it would do. `--target <dir>` picks any directory. Reload the window, then run `/zlak-flow <task>`. VS Code prompt files (`.prompt.md`) are not used: the documentation marks them as part of the deprecated local harness, which the current Copilot harness does not load.

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
| `subagent` | The read-only `zlak-flow-readonly` custom agent, requested by name. Its tools are `read` and `search` only. |
| `copilot:<model>` | Not available: Copilot documents no per-call model for a subagent. |
| `model:<profile>[/<alias>]` | The Harness `run_role` tool on that `coder.json` profile, read-only. Needs a Harness. |

A delegated planner returns the plan text and this session writes the files. A role whose lane is missing is reported at GATE 1, and `self` is used only if you agree.

## Coder configuration

`coder.json` is optional. To configure a coder, copy [`config/coder.example.json`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/copilot/config/coder.example.json) to `.zlak-flow/coder.json` in your project and fill in the endpoint, model and the **name** of the environment variable that holds the key. The file is the same for every platform of zlak-flow. With no `coder.json` at all, the coder is a nested `copilot -p` run.

| Situation | Lane |
| --- | --- |
| A Harness MCP server is connected | The Harness runs every part, for any profile. |
| No `coder.json` and no `--coder` | A nested `copilot -p` run with `--allow-tool write` and git commit and push denied. |
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
packages/copilot/
├── skills/zlak-flow/SKILL.md              the /zlak-flow skill: protocol + run input (generated)
├── agents/zlak-flow-readonly.agent.md     read-only custom agent: read and search tools only
├── config/coder.example.json              starter project configuration (generated)
├── install.mjs                            copies skills/ and agents/ into a Copilot directory
├── tests/plugin.test.mjs                  offline checks (pnpm test), not shipped
└── README.md                              this document
```

`SKILL.md` and `config/coder.example.json` are generated from [`packages/core`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/core/README.md): edit the protocol and the Copilot fragments there and run `pnpm sync` at the repository root. `pnpm check` confirms the generated files are current, the skill is explicit-only, the agent has read and search tools only, and `install.mjs` installs and refuses as described.

## Limitations

- Gates hold because the model follows the protocol. No hook enforces them, so read the gate lines as the contract and reject explicitly.
- `coder.json` is a convention, not a validated schema. A typo shows up as a coder failure, not as a validation error.
- Copilot asks you to approve terminal commands and edits; that is not a gate approval, and the protocol says so. The documentation gives no argument placeholder for skills, so the skill reads your message after `/zlak-flow`. The nested lane needs the `copilot` CLI on `PATH`; its deny patterns do not cover `git -C <dir> commit`, so the workflow checks `git log` afterwards. Runtime memory limits are only enforced when a Harness runs the coder.
- Not yet run in a live Copilot session: the format was checked against the VS Code and GitHub documentation only, the `.github/skills` location comes from a migration page the documentation summary only partly covers, and no Copilot version is recorded here. Your organization's policies may disable skills, custom agents or MCP.
- Only Phase 5 commits, and the workflow never pushes.

## License

MIT © Zealakit. Written by nqhed - Huy Ed. Nguyen.
