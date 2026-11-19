Use the first mechanism this profile actually provides:

1. A subagent that edits files, started with the coder profile's provider and model. For a `host` profile that is its `provider` and the real id of the chosen alias, with nothing else to configure. With no profile (session default), it runs on this session's default model.
2. An MCP coder server, when one is connected. This is also the session default when no file-editing subagent is available.
3. A CLI coder, from the profile's protocol "command" (see below). It always needs a profile.
