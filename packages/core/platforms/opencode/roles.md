- `self`: this session does the work.
- `subagent`: the read-only `zlak-flow-planner` subagent for the planner role, or `zlak-flow-reviewer` for the reviewer role, started through the `subagent` tool on its own configured model. They deny edits and git writes by permission, not only by prompt.
- `opencode:<provider>/<model>`: the same read-only subagent, when its agent file already sets `model` to that value. OpenCode documents no per-call model override for a subagent, so if the agent file names another model, report the role as unavailable at GATE 1 and tell the user to change `model:` in that agent file.
- `model:<profile>[/<alias>]`: the Harness `run_role` tool (role, profile, alias, prompt file) on that coder.json profile, read-only. Only a Harness offers this lane; without one, or without `run_role`, the role is unavailable.

A delegated planner returns the plan text; this session writes the files. Give the subagent the part of the repository it needs in its prompt, because it starts with fresh context.
