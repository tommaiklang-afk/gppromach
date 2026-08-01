// GP Promach — Worker serving the badge-image API + admin edit system.
// Login is handled by Cloudflare Access (Google). Anyone with a Google account can
// sign in; only the OWNER and approved admins can edit. The OWNER approves admins.

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

const OWNER_EMAIL = "tom.maiklang@gmail.com";

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
      // ---- Public badge reads ----
      if (path === "/api/badges" && method === "GET") return getBadges(env);
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
    headers: { "content-type": ct, "cache-control": "public, max-age=31536000, immutable" },
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
