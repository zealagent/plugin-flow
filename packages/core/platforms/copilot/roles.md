- `self`: this session does the work.
- `subagent`: the read-only `zlak-flow-readonly` custom agent, requested by name in the prompt, for the planner or the reviewer role. Its tools are `read` and `search` only, so it cannot edit files or run git; for a review, put the diff in its prompt yourself. If this session cannot start a custom agent as a subagent, report the role as unavailable at GATE 1.
- `model:<profile>[/<alias>]`: the Harness `run_role` tool (role, profile, alias, prompt file) on that coder.json profile, read-only. Only a Harness offers this lane; without one, or without `run_role`, the role is unavailable.

A delegated planner returns the plan text; this session writes the files. A subagent starts with fresh context, so give it what it needs in its prompt.
