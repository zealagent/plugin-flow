- `self`: this session does the work.
- `subagent`: unavailable unless this session offers a read-only subagent; Codex has none built in. Report it as unavailable at GATE 1.
- `codex:<model>`: a nested, read-only Codex run through the shell, from the project root, with the prompt on stdin: `codex exec --model <model> --sandbox read-only -`. It starts a full agent run and bills like one.
- `model:<profile>[/<alias>]`: the Harness `run_role` tool (role, profile, alias, prompt file) on that coder.json profile, read-only. Only a Harness offers this lane; without one, or without `run_role`, the role is unavailable.

For a delegated role, say in its prompt that it must not edit files or run git writes. The read-only sandbox enforces the first; the second is only an instruction, so check `git status` and `git log` afterwards.
