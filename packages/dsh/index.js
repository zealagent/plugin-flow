/**
 * Host half of the zlak-flow bundle: the `/zlak-flow` command.
 *
 * The command expands into the PM/Reviewer protocol and starts one model turn
 * with it, so every later gate lives in the conversation. The protocol names no
 * vendor: any provider, model, or CLI this profile can reach is a valid coder,
 * planner, or reviewer. The Client half renders the sidebar entry and the page
 * that seeds this command. The protocol itself is generated from packages/core
 * into protocol.js; edit it there and run `pnpm sync`.
 * @module @zealakit/agent-plugin-flow-dsh
 */

import { randomUUID } from "node:crypto";
import { USAGE, PROTOCOL } from "./protocol.js";

export const name = "zlak-flow";

export const inject = ["commands", "llm"];

/** Model ids last read per provider id; refreshed in the background. */
const modelCache = new Map();

/**
 * Turn one `listModels` row into a model id.
 * @param row - a string or an object with an `id` or `name`.
 * @returns the id, or an empty string when the row has none.
 */
function modelId(row) {
  if (typeof row === "string") return row;
  const id = row?.id ?? row?.name;
  return typeof id === "string" ? id : "";
}

/**
 * Read the host's providers and refresh their model ids for the next call.
 * The host app owns the credentials; only ids and names are read here.
 * @param llm - the host's `ctx.llm`, when the plugin context has one.
 * @returns the providers known right now, with the models cached so far.
 */
function readHost(llm) {
  if (typeof llm?.listProviders !== "function") return [];
  let providers;
  try {
    providers = llm.listProviders();
  } catch {
    return [];
  }
  if (!Array.isArray(providers)) return [];
  for (const provider of providers) {
    if (typeof llm.listModels !== "function") break;
    Promise.resolve()
      .then(() => llm.listModels(provider.id))
      .then((rows) => {
        if (Array.isArray(rows)) {
          modelCache.set(provider.id, rows.map(modelId).filter(Boolean));
        }
      })
      .catch(() => modelCache.delete(provider.id));
  }
  return providers.map((provider) => ({
    id: String(provider.id),
    name: String(provider.name ?? provider.id),
    models: modelCache.get(provider.id) ?? [],
  }));
}

/**
 * Describe the host's providers for the model.
 * @param providers - the rows from `readHost`.
 * @returns a HOST PROVIDERS block, or an empty string when there are none.
 */
function hostBlock(providers) {
  if (providers.length === 0) return "";
  const lines = providers.map(
    (p) =>
      `- ${p.id} (${p.name}): ${p.models.join(", ") || "models not loaded yet"}`,
  );
  return `\n\nHOST PROVIDERS (read from the app, ids only)\n${lines.join("\n")}`;
}

/**
 * Join the protocol and this run's input into one model-facing message.
 * @param input - everything the user typed after `/zlak-flow`.
 * @param providers - the host's providers, possibly none.
 * @returns the prompt text for the turn.
 */
function buildPrompt(input, providers = []) {
  return `${PROTOCOL}\n\nTHIS RUN'S INPUT\n${input}${hostBlock(providers)}`;
}

/**
 * Build the command definition.
 * @param llm - the host's `ctx.llm`, when present.
 * @returns the command registration.
 */
function makeCommand(llm) {
  return {
    name,
    description:
      "Run the PM/Reviewer workflow: BRD, Plan, Execute, Review, Commit, with a human gate at every step.",
    input: { hint: "[flags] <task>" },
    handler(invocation) {
      const input = String(invocation.rawInput ?? "").trim();
      if (input.length === 0) return { kind: "error", text: USAGE };
      const agent = invocation.agent;
      if (typeof agent?.followup !== "function") {
        return {
          kind: "error",
          text: "zlak-flow needs a live session to start the workflow.",
        };
      }
      const providers = readHost(llm);
      if (typeof agent.inject === "function") {
        // The long protocol rides as injected context, which the app shows as a
        // collapsed `zlak-flow` skill chip and which never wakes the agent. Only
        // the short input below is the visible user turn that starts the run.
        agent.inject({
          id: randomUUID(),
          role: "user",
          source: { kind: "skill-invocation", name, form: "instructions" },
          content: [
            { type: "text", text: `${PROTOCOL}${hostBlock(providers)}` },
          ],
        });
        agent.followup({
          id: randomUUID(),
          role: "user",
          source: { kind: "user" },
          content: [{ type: "text", text: `THIS RUN'S INPUT\n${input}` }],
        });
      } else {
        // A host without `inject`: queue everything as one user turn.
        agent.followup({
          id: randomUUID(),
          role: "user",
          source: { kind: "user" },
          content: [{ type: "text", text: buildPrompt(input, providers) }],
        });
      }
      return {
        kind: "success",
        text: "zlak-flow started. Approve or reject at each \u23f8 gate; the run stops there until you answer.",
      };
    },
  };
}

/**
 * Register the command on this plugin's context.
 * @param ctx - plugin context carrying `commands` and, when the host offers it, `llm`.
 */
export function apply(ctx) {
  readHost(ctx.llm);
  ctx.effect(
    () => ctx.commands.register(makeCommand(ctx.llm)),
    "zlak-flow: /zlak-flow command",
  );
}
