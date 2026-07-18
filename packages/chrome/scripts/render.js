// minimal mustache-subset renderer. supports {{key}}, {{{raw}}}, {{#section}},
// {{^empty}}, dotted access. no partials or helpers. the subset matches what
// pystache renders so a template renders identically across Node and Python

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

function lookup(ctx, key) {
  if (key === ".") return ctx[ctx.length - 1];
  const parts = key.split(".");
  for (let i = ctx.length - 1; i >= 0; i--) {
    let v = ctx[i];
    if (v == null) continue;
    let found = true;
    for (const p of parts) {
      if (v != null && Object.prototype.hasOwnProperty.call(v, p)) {
        v = v[p];
      } else if (p === "length" && Array.isArray(v)) {
        v = v.length;
      } else {
        found = false;
        break;
      }
    }
    if (found) return v;
  }
  return undefined;
}

function isTruthy(v) {
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && v !== false && v !== 0 && v !== "";
}

// templates are loaded once and reused across many SSR calls; cache the
// tokenized form so each template is parsed at most once
const TOKEN_CACHE = new Map();

/**
 * Render a mustache-subset template string against a data context.
 *
 * @param {string} tpl template string
 * @param {object} data data context
 * @returns {string} rendered HTML
 */
export function render(tpl, data) {
  let tokens = TOKEN_CACHE.get(tpl);
  if (!tokens) {
    tokens = tokenize(tpl);
    TOKEN_CACHE.set(tpl, tokens);
  }
  return renderTokens(tokens, [data]);
}

function tokenize(tpl) {
  const tokens = [];
  const re = /\{\{([#^/&]?|\{)\s*([\w.]+)\s*(\}?)\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(tpl)) !== null) {
    if (m.index > last) tokens.push({ type: "text", value: tpl.slice(last, m.index) });
    const sigil = m[1];
    const key = m[2];
    const closeBrace = m[3];
    if (sigil === "{" && closeBrace === "}") {
      tokens.push({ type: "raw", key });
    } else if (sigil === "#") {
      tokens.push({ type: "section_open", key });
    } else if (sigil === "^") {
      tokens.push({ type: "section_open_inverted", key });
    } else if (sigil === "/") {
      tokens.push({ type: "section_close", key });
    } else {
      tokens.push({ type: "var", key });
    }
    last = re.lastIndex;
  }
  if (last < tpl.length) tokens.push({ type: "text", value: tpl.slice(last) });
  return tokens;
}

function renderTokens(tokens, ctx) {
  let out = "";
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.type === "text") {
      out += tok.value;
      i++;
    } else if (tok.type === "var") {
      const v = lookup(ctx, tok.key);
      out += v == null ? "" : escapeHtml(v);
      i++;
    } else if (tok.type === "raw") {
      const v = lookup(ctx, tok.key);
      out += v == null ? "" : String(v);
      i++;
    } else if (tok.type === "section_open" || tok.type === "section_open_inverted") {
      const close = findSectionClose(tokens, i, tok.key);
      const inner = tokens.slice(i + 1, close);
      const v = lookup(ctx, tok.key);
      const inverted = tok.type === "section_open_inverted";
      const truthy = isTruthy(v);
      if (inverted) {
        if (!truthy) out += renderTokens(inner, ctx);
      } else if (Array.isArray(v)) {
        for (let idx = 0; idx < v.length; idx++) {
          const item = typeof v[idx] === "object" && v[idx] !== null
            ? { ...v[idx], "@index": idx, "@first": idx === 0, "@last": idx === v.length - 1, last: idx === v.length - 1 }
            : v[idx];
          out += renderTokens(inner, [...ctx, item]);
        }
      } else if (truthy) {
        out += renderTokens(inner, [...ctx, typeof v === "object" ? v : {}]);
      }
      i = close + 1;
    } else if (tok.type === "section_close") {
      i++;
    } else {
      i++;
    }
  }
  return out;
}

function findSectionClose(tokens, start, key) {
  let depth = 1;
  for (let i = start + 1; i < tokens.length; i++) {
    if ((tokens[i].type === "section_open" || tokens[i].type === "section_open_inverted") && tokens[i].key === key) {
      depth++;
    } else if (tokens[i].type === "section_close" && tokens[i].key === key) {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`unclosed section: ${key}`);
}
