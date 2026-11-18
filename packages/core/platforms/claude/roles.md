- `self`: this session does the work.
- `subagent`: a read-only subagent (the Agent tool) on the session's default subagent model.
- `claude:<model>`: a read-only subagent (the Agent tool) with its model set to that alias, for example `claude:haiku`, `claude:sonnet` or `claude:opus`.
- `coder:<profile>[/<alias>]`: the Harness `run_role` tool (role, profile, alias, prompt file) on that coder.json profile, read-only. Only a Harness offers this lane; without one, or without `run_role`, the role is unavailable.

For a delegated role, prefer an agent type without edit tools, and say in its prompt that it must not edit files or run git writes.
