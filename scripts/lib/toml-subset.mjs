/**
 * The small slice of TOML that zlak-flow writes for Gemini CLI command files:
 * `key = "basic string"` and multi-line strings in `'''literal'''` or
 * `"""basic"""` form, plus `#` comment lines. Anything else is an error, so a
 * generated file that drifts outside this shape fails loudly.
 */

// biome-ignore lint/suspicious/noControlCharactersInRegex: TOML forbids control characters in literal strings, so they are matched on purpose.
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/;
const CONTROL_ALL = new RegExp(CONTROL.source, "g");

/**
 * Write text as a TOML multi-line string. A literal string needs no escaping, so
 * it is used whenever it can hold the text; otherwise a basic string with escapes.
 * @param {string} text - the exact text the string must parse back to.
 * @returns {string} a TOML multi-line string, delimiters included.
 */
export function tomlMultiline(text) {
  const literalSafe =
    !text.includes("'''") && !text.endsWith("'") && !CONTROL.test(text);
  if (literalSafe) return `'''\n${text}'''`;
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(
      CONTROL_ALL,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
  return `"""\n${escaped}"""`;
}

/**
 * Parse the subset above.
 * @param {string} source - TOML text.
 * @returns {Record<string, string>} the string values by key.
 */
export function parseToml(source) {
  /** @type {Record<string, string>} */
  const result = {};
  let rest = source;
  while (rest.length > 0) {
    const line = /^[^\n]*\n?/.exec(rest)?.[0] ?? "";
    if (/^\s*(#.*)?\n?$/.test(line)) {
      rest = rest.slice(line.length);
      continue;
    }
    const head = /^([A-Za-z0-9_-]+) = /.exec(rest);
    if (!head) throw new Error(`unsupported TOML near: ${line.trim()}`);
    rest = rest.slice(head[0].length);
    const key = head[1];
    if (key in result) throw new Error(`duplicate key ${key}`);
    if (rest.startsWith("'''")) {
      const end = rest.indexOf("'''", 3);
      if (end < 0) throw new Error(`unterminated literal string for ${key}`);
      result[key] = rest.slice(3, end).replace(/^\n/, "");
      rest = rest.slice(end + 3);
    } else if (rest.startsWith('"""')) {
      let i = 3;
      while (i < rest.length && !rest.startsWith('"""', i)) {
        i += rest[i] === "\\" ? 2 : 1;
      }
      if (i >= rest.length) throw new Error(`unterminated string for ${key}`);
      result[key] = unescapeBasic(rest.slice(3, i).replace(/^\n/, ""));
      rest = rest.slice(i + 3);
    } else if (rest.startsWith('"')) {
      let i = 1;
      while (i < rest.length && rest[i] !== '"') i += rest[i] === "\\" ? 2 : 1;
      if (i >= rest.length) throw new Error(`unterminated string for ${key}`);
      result[key] = unescapeBasic(rest.slice(1, i));
      rest = rest.slice(i + 1);
    } else {
      throw new Error(`unsupported value for ${key}`);
    }
    const after = /^[ \t]*(#[^\n]*)?\n?/.exec(rest)?.[0] ?? "";
    rest = rest.slice(after.length);
  }
  return result;
}

/** Decode the escapes a TOML basic string may carry. */
function unescapeBasic(text) {
  return text.replace(/\\(["\\bfnrt]|u[0-9A-Fa-f]{4})/g, (_, code) => {
    if (code.startsWith("u"))
      return String.fromCharCode(Number.parseInt(code.slice(1), 16));
    return {
      '"': '"',
      "\\": "\\",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
    }[code];
  });
}
