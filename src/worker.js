// GP Promach — Worker that serves the badge-image API alongside the static site.
// Static assets in ./public are served automatically; this Worker only handles the
// routes below. Admin routes require a valid Cloudflare Access (Google) login.

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

const ALLOWED_KEYS = new Set([
  "capabilities-1", "capabilities-2", "capabilities-3",
  "capabilities-4", "capabilities-5", "capabilities-6",
  "installation-1", "installation-2", "installation-3", "installation-4",
  "trading-1", "trading-2", "trading-3", "trading-4",
]);
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
]);
const MAX_BYTES = 2 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === "/api/badges" && method === "GET") return getBadges(env);
      if (path.startsWith("/badges/") && method === "GET") {
        return getBadgeImage(path.slice("/badges/".length), env);
      }

      // ---- Admin (Cloudflare Access protected) ----
      if (path.startsWith("/admin/")) {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return auth.response;

        if (path === "/admin/login" && method === "GET") {
          return Response.redirect(url.origin + "/?admin=1", 302);
        }
        if (path === "/admin/session" && method === "GET") {
          return json({ admin: true, email: auth.email });
        }
        if (path === "/admin/upload" && method === "POST") {
          return uploadBadge(request, env);
        }
        if (path === "/admin/delete" && method === "POST") {
          return deleteBadge(request, env);
        }
        return json({ error: "not found" }, 404);
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};

async function getBadges(env) {
  const manifest = (await env.BADGES.get("manifest", "json")) || {};
  return new Response(JSON.stringify(manifest), {
    headers: { ...JSON_HEADERS, "cache-control": "no-cache" },
  });
}

async function getBadgeImage(rawKey, env) {
  const key = decodeURIComponent(rawKey);
  if (!ALLOWED_KEYS.has(key)) return new Response("Not found", { status: 404 });
  const res = await env.BADGES.getWithMetadata("img:" + key, { type: "arrayBuffer" });
  if (!res || !res.value) return new Response("Not found", { status: 404 });
  const ct = (res.metadata && res.metadata.contentType) || "application/octet-stream";
  return new Response(res.value, {
    headers: {
      "content-type": ct,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

async function uploadBadge(request, env) {
  const key = request.headers.get("x-badge-key") || "";
  if (!ALLOWED_KEYS.has(key)) return json({ error: "invalid badge key" }, 400);
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
  if (!ALLOWED_KEYS.has(key)) return json({ error: "invalid badge key" }, 400);
  await env.BADGES.delete("img:" + key);
  const manifest = (await env.BADGES.get("manifest", "json")) || {};
  delete manifest[key];
  await env.BADGES.put("manifest", JSON.stringify(manifest));
  return json({ ok: true, key });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

// ---------------- Cloudflare Access verification ----------------

let certCache = { keys: null, at: 0 };

async function requireAdmin(request, env) {
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
