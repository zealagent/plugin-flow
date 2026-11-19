Codex has no in-session subagent that edits files. The lanes, in order:

1. Harness MCP server, when one is connected (tools such as `submit_task`, `get_status`, `get_result`, whatever the server prefix): it serves any profile. Submit one part with the profile name, alias, the part file and the context summary; poll `get_status` until it ends; read `get_result` for changed files, diff and test results. The Harness reads coder.json and the keys itself: pass only names.
2. Without a Harness, by the profile's protocol:
   - no profile (session default): a nested Codex run through the shell, from the project root, with the part's prompt file on stdin. Tell it to stay inside the part's files, run no git writes and never commit:

     ```bash
     codex exec --sandbox workspace-write - < '<prompt_file>'
     ```

     Exit code 0 is success; any other exit code, or running longer than timeout_seconds, is a failed part. The prompt cannot forbid a commit, so check `git log` after the run and report any commit as a failed part.
   - `command`: a CLI coder, run through the shell (see below).
   - `anthropic`, `openai` or `host`: needs a Harness; without one, say so and stop.

If the nested run cannot write files, the sandbox is the likely cause: say so and stop. Never widen the sandbox on your own.

For shell lanes, when timeout_seconds is longer than a foreground command allows, run the job in the background, wait for it to finish, and stop it once timeout_seconds have passed.
