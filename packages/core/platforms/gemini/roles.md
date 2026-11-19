- `self`: this session does the work.
- `subagent`: unavailable. Gemini CLI subagents are a preview feature and this workflow does not use them; report it as unavailable at GATE 1.
- `gemini:<model>`: a nested Gemini run through the shell tool, from the project root, with the prompt file on stdin: `gemini -m <model> --approval-mode plan -p "Follow the instructions on stdin." < <prompt_file>`. It starts a full agent run and bills like one.
- `model:<profile>[/<alias>]`: the Harness `run_role` tool (role, profile, alias, prompt file) on that coder.json profile, read-only. Only a Harness offers this lane; without one, or without `run_role`, the role is unavailable.

For a delegated role, say in its prompt that it must not edit files or run git writes. The documentation does not promise that `plan` mode is strictly read-only, so check `git status` and `git log` after the run and report any change as a failure.
