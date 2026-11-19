Gemini CLI has no subagent this workflow relies on to edit files. The lanes, in order:

1. Harness MCP server, when one is connected (tools such as `submit_task`, `get_status`, `get_result`, whatever the server prefix): it serves any profile. Submit one part with the profile name, alias, the part file and the context summary; poll `get_status` until it ends; read `get_result` for changed files, diff and test results. The Harness reads coder.json and the keys itself: pass only names.
2. Without a Harness, by the profile's protocol:
   - no profile (session default): a nested Gemini run through the shell tool, from the project root, with the part's prompt file on stdin. Tell it to stay inside the part's files, run no git writes and never commit:

     ```bash
     gemini --approval-mode auto_edit -p "Carry out the instructions on stdin." < '<prompt_file>'
     ```

     `auto_edit` approves file edits only, so the run cannot run tests or git; this session runs the test command after the part. Exit code 0 is success; any other exit code, or running longer than timeout_seconds, is a failed part. The prompt cannot forbid a commit, so check `git log` after the run and report any commit as a failed part.
   - `command`: a CLI coder, run through the shell tool (see below).
   - `anthropic`, `openai` or `host`: needs a Harness; without one, say so and stop.

If the nested run cannot edit files or is waiting for an approval it cannot get, say so and stop. Never switch to `yolo` on your own.

For shell lanes, when timeout_seconds is longer than a foreground command allows, run the job in the background, wait for it to finish, and stop it once timeout_seconds have passed.
