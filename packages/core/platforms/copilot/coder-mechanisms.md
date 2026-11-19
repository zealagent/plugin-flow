This host has no file-editing subagent this workflow relies on. The lanes, in order:

1. Harness MCP server, when one is connected (tools such as `submit_task`, `get_status`, `get_result`, whatever the server prefix): it serves any profile. Submit one part with the profile name, alias, the part file and the context summary; poll `get_status` until it ends; read `get_result` for changed files, diff and test results. The Harness reads coder.json and the keys itself: pass only names.
2. Without a Harness, by the profile's protocol:
   - no profile (session default): a nested Copilot CLI run through the terminal, from the project root, pointed at the part's prompt file. Tell it to stay inside the part's files and never commit or push:

     ```bash
     copilot -p "Read the file <prompt_file> and carry out its instructions." --allow-tool 'write' --deny-tool 'shell(git commit)' --deny-tool 'shell(git push)'
     ```

     Exit code 0 is success; any other exit code, or running longer than timeout_seconds, is a failed part. The deny patterns do not cover variants such as `git -C <dir> commit`, so check `git log` after the run and report any commit as a failed part. Without the `copilot` CLI, say so and stop.
   - `command`: a CLI coder, run through the terminal (see below).
   - `anthropic`, `openai` or `host`: needs a Harness; without one, say so and stop.

Never add `--allow-all-tools` on your own.

For terminal lanes, when timeout_seconds is longer than a foreground command allows, run the job in the background, wait for it to finish, and stop it once timeout_seconds have passed.
