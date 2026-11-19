- `self`: this session does the work.
- `subagent`: the read-only `zlak-flow-planner` subagent for the planner role, or `zlak-flow-reviewer` for the reviewer role, started by name. Their definitions set `readonly: true`, which Cursor documents as no file edits and no state-changing shell commands.
- `cursor:<model>`: the same read-only subagent, when its definition already sets `model` to that value. If it names another model, report the role as unavailable at GATE 1 and tell the user to change `model:` in that agent file.
- `model:<profile>[/<alias>]`: the Harness `run_role` tool (role, profile, alias, prompt file) on that coder.json profile, read-only. Only a Harness offers this lane; without one, or without `run_role`, the role is unavailable.

A delegated planner returns the plan text; this session writes the files. A subagent starts with fresh context, so give it what it needs in its prompt.
