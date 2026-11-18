1. Harness MCP server, when one is connected (tools such as `submit_task`, `get_status`, `get_result`, whatever the server prefix): it serves any profile. Submit one part with the profile name, alias, the part file and the context summary; poll `get_status` until it ends; read `get_result` for changed files, diff and test results. The Harness reads coder.json and the keys itself: pass only names.
2. Without a Harness, by the profile's protocol:
   - no profile (session default): a general-purpose subagent (the Agent tool) that edits files, told to stay inside the part's files, run no git writes and never commit.
   - `command`: a CLI coder, run through Bash (see below).
   - `anthropic`: a headless Claude Code run against that endpoint, through Bash, from the project root, with the key passed by name and never echoed:

     ```bash
     env -u ANTHROPIC_API_KEY ANTHROPIC_BASE_URL='<base_url>' ANTHROPIC_AUTH_TOKEN="${<api_key_env>}" ANTHROPIC_MODEL='<real model id>' claude -p --permission-mode acceptEdits --disallowedTools 'Bash(git commit:*)' 'Bash(git push:*)' < '<prompt_file>'
     ```

     Exit code 0 is success; any other exit code, or running longer than timeout_seconds, is a failed part.
   - `openai`: needs a Harness; without one, say so and stop.

For Bash lanes, when timeout_seconds is longer than a foreground Bash call allows, run the job in the background, wait for it to finish, and stop it once timeout_seconds have passed.
