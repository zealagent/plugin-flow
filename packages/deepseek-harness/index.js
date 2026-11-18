/**
 * Host half of the zla-flow bundle: the `/zla-flow` command.
 *
 * The command expands into the PM/Reviewer protocol and starts one model turn
 * with it, so every later gate lives in the conversation. The protocol names no
 * vendor: any provider, model, or CLI this profile can reach is a valid coder,
 * planner, or reviewer. The Client half renders the sidebar entry and the page
 * that seeds this command. The protocol itself is generated from packages/core
 * into protocol.js; edit it there and run `pnpm sync`.
 * @module @zealagent/plugin-flow-deepseek-harness
 */

import { randomUUID } from "node:crypto";
import { USAGE, PROTOCOL } from "./protocol.js";

export const name = "zla-flow";

export const inject = ["commands"];

/**
 * Join the protocol and this run's input into one model-facing message.
 * @param input - everything the user typed after `/zla-flow`.
 * @returns the prompt text for the turn.
 */
function buildPrompt(input) {
  return `${PROTOCOL}\n\nTHIS RUN'S INPUT\n${input}`;
}

/**
 * Build the command definition.
 * @returns the command registration.
 */
function makeCommand() {
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
          text: "zla-flow needs a live session to start the workflow.",
        };
      }
      // Queue the protocol as the next user turn: the model then drives Phase 1
      // and stops at the first gate, exactly like the original slash command.
      agent.followup({
        id: randomUUID(),
        role: "user",
        source: { kind: "user" },
        content: [{ type: "text", text: buildPrompt(input) }],
      });
      return {
        kind: "success",
        text: "zla-flow started. Approve or reject at each \u23f8 gate; the run stops there until you answer.",
      };
    },
  };
}

/**
 * Register the command on this plugin's context.
 * @param ctx - plugin context carrying `commands`.
 */
export function apply(ctx) {
  ctx.effect(
    () => ctx.commands.register(makeCommand()),
    "zla-flow: /zla-flow command",
  );
}
