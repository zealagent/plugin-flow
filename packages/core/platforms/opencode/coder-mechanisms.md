The lanes, in order:

1. Harness MCP server, when one is connected (tools such as `submit_task`, `get_status`, `get_result`, whatever the server prefix): it serves any profile. Submit one part with the profile name, alias, the part file and the context summary; poll `get_status` until it ends; read `get_result` for changed files, diff and test results. The Harness reads coder.json and the keys itself: pass only names.
2. Without a Harness, by the profile's protocol:
   - no profile (session default): the `zlak-flow-coder` subagent, started through the `subagent` tool with the part's prompt file content. It edits files and runs commands but its permissions deny `git commit` and `git push`; tell it to stay inside the part's files. It uses the model set in its agent file. Variants such as `git -C <dir> commit` are not covered by the permission patterns, so check `git log` after the run and report any commit as a failed part.
   - `command`: a CLI coder, run through the shell (see below).
   - `anthropic`, `openai` or `host`: needs a Harness; without one, say so and stop.

If the subagent is missing, tell the user to install it (`node install.mjs` in the OpenCode package) and stop.

For shell lanes, when timeout_seconds is longer than a foreground command allows, run the job in the background, wait for it to finish, and stop it once timeout_seconds have passed.
