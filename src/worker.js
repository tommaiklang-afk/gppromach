// GP Promach — Worker serving the badge-image API + admin edit system.
// Login is handled by Cloudflare Access (Google). Anyone with a Google account can
// sign in; only the OWNER and approved admins can edit. The OWNER approves admins.

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

const OWNER_EMAIL = "tom.maiklang@gmail.com";

const ALLOWED_KEYS = new Set([
  "capabilities-1", "capabilities-2", "capabilities-3",
  "capabilities-4", "capabilities-5", "capabilities-6",
  "installation-1", "installation-2", "installation-3", "installation-4",
  "design-1", "design-2", "design-3", "design-4",
  "trading-1", "trading-2", "trading-3", "trading-4",
]);
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
]);
const MAX_BYTES = 2 * 1024 * 1024;

// Editable text keys (must match the i18n keys in public/lang.js). Kept as a
// fixed allowlist so an admin can only overwrite known copy, never inject new keys.
const ALLOWED_CONTENT_KEYS = new Set([
  "hero_eyebrow", "hero_p", "hero_cta", "hero_link",
  "cap_eyebrow", "cap_h2", "cap_p",
  "c1_h", "c1_p", "c2_h", "c2_p", "c3_h", "c3_p",
  "c4_h", "c4_p", "c5_h", "c5_p", "c6_h", "c6_p",
  "inst_eyebrow", "inst_h2", "inst_p",
  "i1_h", "i1_p", "i2_h", "i2_p", "i3_h", "i3_p", "i4_h", "i4_p",
  "trade_eyebrow", "trade_h2", "trade_p",
  "t1_h", "t1_p", "t2_h", "t2_p", "t3_h", "t3_p", "t4_h", "t4_p",
  "design_eyebrow", "design_h2", "design_p",
  "d1_h", "d1_p", "d2_h", "d2_p", "d3_h", "d3_p", "d4_h", "d4_p",
  "foot_desc", "foot_company", "foot_copy",
  "contact_eyebrow", "contact_h1", "contact_p", "contact_back",
  "p1_role", "p1_name", "p1_th", "p1_phone", "p1_email",
  "p2_role", "p2_name", "p2_th", "p2_phone", "p2_email",
  "hero_h1", "contact_addr",
]);
// Keys whose default carries intentional markup. Their overrides are sanitized to
// a tiny tag/attribute allowlist instead of being flattened to plain text.
const HTML_CONTENT_KEYS = new Set(["hero_h1", "contact_addr"]);
const HTML_ALLOWED_TAGS = { br: 1, span: 1, strong: 1, em: 1, b: 1, i: 1 };
const ALLOWED_LANGS = new Set(["en", "th"]);
const MAX_CONTENT_LEN = 2000;

// Admin-created cards live per section as an ordered list of ids in KV "cards".
// Their text is stored in the normal content KV under keys "<id>:h" / "<id>:p",
// and their image under the badge key "<id>", so they reuse the existing text and
// badge pipelines. Ids look like "c_1a2b3c4d5e".
const CARD_SECTIONS = new Set(["capabilities", "installation", "design", "trading"]);
const CARD_ID_RE = /^c_[a-z0-9]{6,}$/;
const DYN_CONTENT_RE = /^c_[a-z0-9]{6,}:(h|p)$/;
const DEFAULT_CARD = { h: "New service", p: "Describe this service." };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ---- Public reads ----
      if (path === "/api/badges" && method === "GET") return getBadges(env);
      if (path === "/api/content" && method === "GET") return getContent(env);
      if (path === "/api/cards" && method === "GET") return getCardsResponse(env);
      if (path.startsWith("/badges/") && method === "GET") {
        return getBadgeImage(path.slice("/badges/".length), env);
      }

      // ---- Admin (Cloudflare Access protected at the edge) ----
      if (path.startsWith("/admin/")) {
        const auth = await requireAuthed(request, env);
        if (!auth.ok) return auth.response;
        const email = (auth.email || "").toLowerCase();
        const role = await roleFor(email, env);

        if (path === "/admin/login" && method === "GET") {
          if (role === "pending") await recordRequest(email, env);
          return Response.redirect(url.origin + "/?admin=1", 302);
        }
        if (path === "/admin/session" && method === "GET") {
          if (role === "pending") await recordRequest(email, env);
          return json({ email, role });
        }
        if (path === "/admin/upload" && method === "POST") {
          if (role === "pending") return json({ error: "you don't have edit access yet" }, 403);
          return uploadBadge(request, env);
        }
        if (path === "/admin/delete" && method === "POST") {
          if (role === "pending") return json({ error: "you don't have edit access yet" }, 403);
          return deleteBadge(request, env);
        }
        if (path === "/admin/content" && method === "POST") {
          if (role === "pending") return json({ error: "you don't have edit access yet" }, 403);
          return saveContent(request, env);
        }
        if (path === "/admin/cards/add" && method === "POST") {
          if (role === "pending") return json({ error: "you don't have edit access yet" }, 403);
          return addCard(request, env);
        }
        if (path === "/admin/cards/remove" && method === "POST") {
          if (role === "pending") return json({ error: "you don't have edit access yet" }, 403);
          return removeCard(request, env);
        }
        if (path === "/admin/cards/hide" && method === "POST") {
          if (role === "pending") return json({ error: "you don't have edit access yet" }, 403);
          return hideCard(request, env);
        }
        if (path === "/admin/cards/unhide" && method === "POST") {
          if (role === "pending") return json({ error: "you don't have edit access yet" }, 403);
          return unhideCard(request, env);
        }
        // ---- Owner-only admin management ----
        if (path === "/admin/admins" && method === "GET") {
          if (role !== "owner") return json({ error: "owner only" }, 403);
          return json({
            owner: OWNER_EMAIL,
            admins: await getList("admins", env),
            requests: await getList("requests", env),
          });
        }
        if (path === "/admin/admins/add" && method === "POST") {
          if (role !== "owner") return json({ error: "owner only" }, 403);
          return addAdmin(request, env);
        }
        if (path === "/admin/admins/remove" && method === "POST") {
          if (role !== "owner") return json({ error: "owner only" }, 403);
          return removeAdmin(request, env);
        }
        return json({ error: "not found" }, 404);
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  },
};

// ---------------- Roles ----------------

async function roleFor(email, env) {
  if (!email) return "pending";
  if (email === OWNER_EMAIL) return "owner";
  const admins = await getList("admins", env);
  return admins.indexOf(email) !== -1 ? "admin" : "pending";
}

async function getList(key, env) {
  const v = await env.BADGES.get("acl:" + key, "json");
  return Array.isArray(v) ? v : [];
}
async function putList(key, arr, env) {
  await env.BADGES.put("acl:" + key, JSON.stringify(arr));
}

async function recordRequest(email, env) {
  const admins = await getList("admins", env);
  if (email === OWNER_EMAIL || admins.indexOf(email) !== -1) return;
  const reqs = await getList("requests", env);
  if (reqs.indexOf(email) !== -1) return;
  reqs.push(email);
  await putList("requests", reqs.slice(-100), env);
}

async function addAdmin(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || email.indexOf("@") === -1) return json({ error: "invalid email" }, 400);
  const admins = await getList("admins", env);
  if (admins.indexOf(email) === -1) admins.push(email);
  await putList("admins", admins, env);
  const reqs = (await getList("requests", env)).filter((e) => e !== email);
  await putList("requests", reqs, env);
  return json({ ok: true, admins, requests: reqs });
}

async function removeAdmin(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const admins = (await getList("admins", env)).filter((e) => e !== email);
  await putList("admins", admins, env);
  return json({ ok: true, admins });
}

// ---------------- Badges ----------------

// A badge image is allowed for a fixed built-in slot or any admin-created card id.
function isBadgeKey(key) {
  return ALLOWED_KEYS.has(key) || CARD_ID_RE.test(key);
}

async function getBadges(env) {
  const manifest = (await env.BADGES.get("manifest", "json")) || {};
  return new Response(JSON.stringify(manifest), {
    headers: { ...JSON_HEADERS, "cache-control": "no-cache" },
  });
}

async function getBadgeImage(rawKey, env) {
  const key = decodeURIComponent(rawKey);
  if (!isBadgeKey(key)) return new Response("Not found", { status: 404 });
  const res = await env.BADGES.getWithMetadata("img:" + key, { type: "arrayBuffer" });
  if (!res || !res.value) return new Response("Not found", { status: 404 });
  const ct = (res.metadata && res.metadata.contentType) || "application/octet-stream";
  return new Response(res.value, {
    headers: { "content-type": ct, "cache-control": "public, max-age=31536000, immutable" },
  });
}

async function uploadBadge(request, env) {
  const key = request.headers.get("x-badge-key") || "";
  if (!isBadgeKey(key)) return json({ error: "invalid badge key" }, 400);
  const ct = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(ct)) return json({ error: "unsupported image type" }, 415);
  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0) return json({ error: "empty file" }, 400);
  if (buf.byteLength > MAX_BYTES) return json({ error: "image too large (max 2 MB)" }, 413);

  const updatedAt = Date.now();
  await env.BADGES.put("img:" + key, buf, { metadata: { contentType: ct, updatedAt } });
  const manifest = (await env.BADGES.get("manifest", "json")) || {};
  manifest[key] = { contentType: ct, updatedAt };
  await env.BADGES.put("manifest", JSON.stringify(manifest));
  return json({ ok: true, key, updatedAt });
}

async function deleteBadge(request, env) {
  const key = request.headers.get("x-badge-key") || "";
  if (!isBadgeKey(key)) return json({ error: "invalid badge key" }, 400);
  await env.BADGES.delete("img:" + key);
  const manifest = (await env.BADGES.get("manifest", "json")) || {};
  delete manifest[key];
  await env.BADGES.put("manifest", JSON.stringify(manifest));
  return json({ ok: true, key });
}

// ---------------- Editable text content ----------------

async function getContent(env) {
  const content = normalizeContent(await env.BADGES.get("content", "json"));
  return new Response(JSON.stringify(content), {
    headers: { ...JSON_HEADERS, "cache-control": "no-cache" },
  });
}

async function saveContent(request, env) {
  const body = await request.json().catch(() => ({}));
  const lang = String(body.lang || "");
  const key = String(body.key || "");
  if (!ALLOWED_LANGS.has(lang)) return json({ error: "invalid language" }, 400);
  if (!ALLOWED_CONTENT_KEYS.has(key) && !DYN_CONTENT_RE.test(key)) {
    return json({ error: "invalid content key" }, 400);
  }

  // Strip control characters (newlines, tabs) and collapse runs of whitespace.
  let raw = (typeof body.value === "string" ? body.value : "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (raw.length > MAX_CONTENT_LEN) return json({ error: "text too long" }, 413);

  // HTML keys keep a safe subset of markup; everything else is stored verbatim and
  // rendered on the client with textContent (so it can never inject markup).
  const value = HTML_CONTENT_KEYS.has(key) && raw ? await sanitizeHtml(raw) : raw;

  const content = normalizeContent(await env.BADGES.get("content", "json"));
  if (value) content[lang][key] = value;
  else delete content[lang][key];
  await env.BADGES.put("content", JSON.stringify(content));
  return json({ ok: true, lang, key });
}

// ---------------- Admin-created cards ----------------

async function getCards(env) {
  const c = await env.BADGES.get("cards", "json");
  const out = {};
  for (const s of CARD_SECTIONS) out[s] = c && Array.isArray(c[s]) ? c[s] : [];
  return out;
}

async function getCardsResponse(env) {
  const out = await getCards(env);
  out.hidden = await getHidden(env);
  return new Response(JSON.stringify(out), {
    headers: { ...JSON_HEADERS, "cache-control": "no-cache" },
  });
}

// Built-in cards can't be removed from the HTML, so "deleting" one records its
// badge key in a hidden list; the client drops those cards for every visitor.
async function getHidden(env) {
  const h = await env.BADGES.get("hidden", "json");
  return Array.isArray(h) ? h : [];
}

async function hideCard(request, env) {
  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "");
  if (!ALLOWED_KEYS.has(key)) return json({ error: "invalid card key" }, 400);
  const hidden = await getHidden(env);
  if (hidden.indexOf(key) === -1) hidden.push(key);
  await env.BADGES.put("hidden", JSON.stringify(hidden));
  return json({ ok: true, key });
}

async function unhideCard(_request, env) {
  await env.BADGES.put("hidden", JSON.stringify([]));
  return json({ ok: true });
}

function randHex(n) {
  const a = crypto.getRandomValues(new Uint8Array(n));
  let s = "";
  for (const b of a) s += b.toString(16).padStart(2, "0");
  return s;
}

async function addCard(request, env) {
  const body = await request.json().catch(() => ({}));
  const section = String(body.section || "");
  if (!CARD_SECTIONS.has(section)) return json({ error: "invalid section" }, 400);

  const cards = await getCards(env);
  const id = "c_" + randHex(5);
  cards[section].push(id);
  await env.BADGES.put("cards", JSON.stringify(cards));

  // Seed default text for both languages so the new card is never blank.
  const content = normalizeContent(await env.BADGES.get("content", "json"));
  for (const lang of ALLOWED_LANGS) {
    content[lang][id + ":h"] = DEFAULT_CARD.h;
    content[lang][id + ":p"] = DEFAULT_CARD.p;
  }
  await env.BADGES.put("content", JSON.stringify(content));

  return json({ ok: true, id, section, h: DEFAULT_CARD.h, p: DEFAULT_CARD.p });
}

async function removeCard(request, env) {
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!CARD_ID_RE.test(id)) return json({ error: "invalid card id" }, 400);

  const cards = await getCards(env);
  let section = null;
  for (const s of CARD_SECTIONS) {
    const i = cards[s].indexOf(id);
    if (i !== -1) { cards[s].splice(i, 1); section = s; }
  }
  await env.BADGES.put("cards", JSON.stringify(cards));

  // Clean up the card's text overrides and any uploaded image.
  const content = normalizeContent(await env.BADGES.get("content", "json"));
  for (const lang of ALLOWED_LANGS) {
    delete content[lang][id + ":h"];
    delete content[lang][id + ":p"];
  }
  await env.BADGES.put("content", JSON.stringify(content));

  await env.BADGES.delete("img:" + id);
  const manifest = (await env.BADGES.get("manifest", "json")) || {};
  delete manifest[id];
  await env.BADGES.put("manifest", JSON.stringify(manifest));

  return json({ ok: true, id, section });
}

// Reduce arbitrary HTML to a tiny allowlist: only br/span/strong/em/b/i survive,
// spans keep a class="accent" and nothing else, all other tags are unwrapped, and
// script/style are dropped entirely. Uses the Workers-native HTMLRewriter parser.
async function sanitizeHtml(input) {
  const rewriter = new HTMLRewriter().on("*", {
    element(el) {
      const tag = el.tagName;
      if (tag === "script" || tag === "style") { el.remove(); return; }
      if (!HTML_ALLOWED_TAGS[tag]) { el.removeAndKeepContent(); return; }
      const names = [];
      for (const attr of el.attributes) names.push(attr[0]);
      for (const name of names) {
        if (tag === "span" && name === "class") continue;
        el.removeAttribute(name);
      }
      if (tag === "span" && el.getAttribute("class") !== "accent") {
        el.removeAttribute("class");
      }
    },
  });
  const out = rewriter.transform(
    new Response(input, { headers: { "content-type": "text/html" } })
  );
  return (await out.text()).trim();
}

function normalizeContent(v) {
  const c = v && typeof v === "object" ? v : {};
  return {
    en: c.en && typeof c.en === "object" ? c.en : {},
    th: c.th && typeof c.th === "object" ? c.th : {},
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

// ---------------- Cloudflare Access verification ----------------

let certCache = { keys: null, at: 0 };

async function requireAuthed(request, env) {
  const team = (env.ACCESS_TEAM_DOMAIN || "").trim();
  const aud = (env.ACCESS_AUD || "").trim();
  if (!team || !aud) {
    return { ok: false, response: json({ error: "admin login is not configured yet" }, 503) };
  }
  const token =
    request.headers.get("Cf-Access-Jwt-Assertion") || getCookie(request, "CF_Authorization");
  if (!token) return { ok: false, response: json({ error: "not signed in" }, 401) };
  try {
    const payload = await verifyAccessJwt(token, team, aud);
    return { ok: true, email: payload.email || "" };
  } catch (e) {
    return { ok: false, response: json({ error: "access denied: " + e.message }, 403) };
  }
}

function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

async function getAccessKeys(team) {
  const now = Date.now();
  if (certCache.keys && now - certCache.at < 3600000) return certCache.keys;
  const res = await fetch("https://" + team + "/cdn-cgi/access/certs");
  if (!res.ok) throw new Error("cannot fetch access certs");
  const data = await res.json();
  certCache = { keys: data.keys || [], at: now };
  return certCache.keys;
}

async function verifyAccessJwt(token, team, aud) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const header = JSON.parse(b64urlToString(parts[0]));
  const payload = JSON.parse(b64urlToString(parts[1]));

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) throw new Error("token expired");
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) throw new Error("audience mismatch");
  if (payload.iss && payload.iss.indexOf(team) === -1) throw new Error("issuer mismatch");

  const keys = await getAccessKeys(team);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown signing key");
  const key = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );
  const signed = new TextEncoder().encode(parts[0] + "." + parts[1]);
  const sig = b64urlToBytes(parts[2]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, signed);
  if (!valid) throw new Error("bad signature");
  return payload;
}

function b64urlToBytes(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlToString(b64url) {
  return new TextDecoder().decode(b64urlToBytes(b64url));
}
