// @ts-nocheck: the bundle runs against stub React and DOM globals.
/**
 * Offline checks for the zla-flow bundle.
 *
 * - The coder.json template embedded in client.js is byte-identical to
 *   config/coder.example.json, and both parse as JSON.
 * - The Client EN and VI dictionaries have the same keys.
 * - The Panel renders with stub React and every t() key it asks for exists.
 * - The /zla-flow command handler returns usage, refuses without a session,
 *   and queues the protocol plus the run's input.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(root + path, "utf8");

// Load client.js through a stub module loader and stub React.
let module;
globalThis.window = {
  __ModuleLoader__: {
    load(def) {
      module = def;
    },
  },
};
const element = (type, props, ...children) => ({
  type,
  props: props ?? {},
  children: children.flat(),
});
// Panel state, in useState call order: task, profile, alias, copied, failure.
let seed = [];
const React = {
  createElement: element,
  useState: (init) => [seed.length > 0 ? seed.shift() : init, () => {}],
  useRef: (init) => ({ current: init }),
  useEffect: () => {},
};
new Function(read("client.js"))();
const factory = module.factory((name) => {
  assert.equal(name, "react");
  return React;
});

// Capture what the bundle registers.
const registered = {};
const dictionaries = {};
let styles = "";
globalThis.document = {
  createElement: () => ({
    dataset: {},
    set textContent(v) {
      styles = v;
    },
    remove() {},
  }),
  head: { appendChild() {} },
};
factory.apply({
  effect: (fn) => fn(),
  get: () => undefined,
  locale: {
    register: (ns, dicts) => {
      dictionaries[ns] = dicts;
    },
    bind: () => (key) => key,
  },
  slots: {
    inject: (_name, fn) => fn(),
    register: (opts, component) => {
      registered[opts.name] = { opts, component };
    },
  },
});
assert.ok(styles.includes(".zla-page"), "styles injected");

const source = read("client.js");
const { en, vi } = dictionaries["zla-flow"];
const asked = new Set();
const t = (key) => {
  asked.add(key);
  return key;
};
const Panel = registered.main.component;
const find = (node, pred, out = []) => {
  if (node && typeof node === "object") {
    if (pred(node)) out.push(node);
    for (const child of node.children ?? []) find(child, pred, out);
  }
  return out;
};
const render = (task, profile, alias) => {
  seed = [task, profile, alias, "", ""];
  const node = Panel({ zlaT: t, zlaStart: () => true });
  return {
    buttons: find(node, (n) => n.type === "button"),
    invalid:
      find(node, (n) => n.children?.includes("start.invalidField")).length > 0,
  };
};

test("the embedded coder template matches config/coder.example.json", () => {
  const match = source.match(/const CODER_TEMPLATE = `([\s\S]*?)`;\n/);
  assert.ok(match, "CODER_TEMPLATE found");
  const template = match[1].replace(/\\\$/g, "$");
  assert.equal(template, read("config/coder.example.json"));
  JSON.parse(template);
});

test("EN and VI dictionaries have the same keys", () => {
  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort());
});

test("the panel renders and every key it asks for exists", () => {
  seed = [];
  const tree = Panel({ zlaT: t, zlaStart: () => true });
  assert.deepEqual(
    [...asked].filter((key) => !(key in en)),
    [],
  );
  const buttons = find(tree, (n) => n.type === "button");
  assert.equal(buttons.length, 3);
  assert.equal(buttons[0].props.disabled, true, "start disabled on empty task");
  assert.equal(buttons[1].props.disabled, true, "copy disabled on empty task");
  assert.notEqual(buttons[2].props.disabled, true, "template copy enabled");
});

test("the panel validates the profile and alias fields", () => {
  let view = render("Add x", "default", "fast");
  assert.equal(view.buttons[0].props.disabled, false);
  assert.equal(view.invalid, false);
  for (const [profile, alias] of [
    ["my profile", ""],
    ["", "--adopt"],
    ['a"b', ""],
    ["", "it's"],
  ]) {
    view = render("Add x", profile, alias);
    assert.equal(
      view.buttons[0].props.disabled,
      true,
      `start: ${profile}|${alias}`,
    );
    assert.equal(
      view.buttons[1].props.disabled,
      true,
      `copy: ${profile}|${alias}`,
    );
    assert.equal(view.invalid, true, `warning: ${profile}|${alias}`);
  }
  view = render("Add x", "openai/gpt-5.1", "deepseek-chat");
  assert.equal(view.invalid, false, "provider/model style values accepted");
});

test("the /zla-flow command", async () => {
  const host = await import(`${root}index.js`);
  const commands = {};
  host.apply({
    effect: (fn) => fn(),
    commands: {
      register: (c) => {
        commands[c.name] = c;
      },
    },
  });
  assert.deepEqual(Object.keys(commands), ["zla-flow"]);
  const command = commands["zla-flow"];
  assert.equal(command.handler({ rawInput: "   " }).kind, "error");
  assert.equal(command.handler({ rawInput: "x", agent: {} }).kind, "error");
  assert.equal(
    command.handler({ agent: {} }).kind,
    "error",
    "missing rawInput is usage, not a crash",
  );
  let queued;
  const result = command.handler({
    rawInput: "Add tests",
    agent: {
      followup: (m) => {
        queued = m;
      },
    },
  });
  assert.equal(result.kind, "success");
  const protocol = queued.content[0].text;
  assert.ok(protocol.endsWith("THIS RUN'S INPUT\nAdd tests"));
  for (const marker of [
    "\u23f8 PART FAILED",
    "After PART FAILED",
    "0. No configuration",
    "a command profile cannot",
  ]) {
    assert.ok(protocol.includes(marker), `protocol mentions ${marker}`);
  }
});

test("a rejected start promise surfaces as a failure on the page", async () => {
  seed = ["Add x", "", "", "", ""];
  let failureSet;
  const realUseState = React.useState;
  let calls = 0;
  React.useState = (init) => {
    const index = calls++;
    const [value] = realUseState(init);
    return [
      value,
      index === 4
        ? (v) => {
            failureSet = v;
          }
        : () => {},
    ];
  };
  const started = Panel({
    zlaT: t,
    zlaStart: () => Promise.reject(new Error("no")),
  });
  React.useState = realUseState;
  find(started, (n) => n.type === "button")[0].props.onClick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(failureSet, "start.failed");
});
