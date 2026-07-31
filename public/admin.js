// GP Promach — badge images + admin edit mode.
// Public visitors: shows any uploaded badge images.
// Admins (signed in via Google/Cloudflare Access): an edit toggle to upload/replace.
(function () {
  var manifest = {};
  var isAdmin = false;
  var editMode = false;
  var fileInput = null;
  var pendingKey = null;

  // Give every card icon a stable key: <sectionId>-<index within section>.
  function keyedIcos() {
    var out = [];
    var sections = document.querySelectorAll("section[id]");
    for (var s = 0; s < sections.length; s++) {
      var icos = sections[s].querySelectorAll(".ico");
      for (var i = 0; i < icos.length; i++) {
        var key = sections[s].id + "-" + (i + 1);
        icos[i].setAttribute("data-badge", key);
        out.push(icos[i]);
      }
    }
    return out;
  }

  function renderBadge(ico, key, v) {
    if (!ico) return;
    var img = ico.querySelector("img.badge-img");
    if (!img) {
      var sq = ico.querySelector("span");
      if (sq) sq.parentNode.removeChild(sq);
      img = document.createElement("img");
      img.className = "badge-img";
      img.alt = "";
      ico.appendChild(img);
    }
    img.src = "/badges/" + encodeURIComponent(key) + "?v=" + (v || Date.now());
  }

  function applyManifest(icos) {
    for (var i = 0; i < icos.length; i++) {
      var key = icos[i].getAttribute("data-badge");
      if (manifest[key]) renderBadge(icos[i], key, manifest[key].updatedAt);
    }
  }

  function loadBadges(icos) {
    return fetch("/api/badges", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (m) { manifest = m || {}; applyManifest(icos); })
      .catch(function () {});
  }

  function checkAdmin() {
    return fetch("/admin/session", { redirect: "manual", cache: "no-store" })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .then(function (data) {
        if (data && data.admin) { isAdmin = true; buildBar(data.email); }
      })
      .catch(function () {});
  }

  function buildBar(email) {
    if (document.querySelector(".admin-bar")) return;
    var bar = document.createElement("div");
    bar.className = "admin-bar";

    var info = document.createElement("span");
    info.className = "admin-info";
    info.textContent = "Admin" + (email ? " · " + email : "");

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "admin-btn";
    toggle.textContent = "Turn on edit mode";
    toggle.addEventListener("click", function () {
      editMode = !editMode;
      document.body.classList.toggle("edit-mode", editMode);
      toggle.textContent = editMode ? "Turn off edit mode" : "Turn on edit mode";
      hint.style.display = editMode ? "" : "none";
    });

    var hint = document.createElement("span");
    hint.className = "admin-hint";
    hint.textContent = "Click any badge to upload an image (PNG/JPG/SVG, max 2 MB).";
    hint.style.display = "none";

    var logout = document.createElement("a");
    logout.className = "admin-link";
    logout.href = "/cdn-cgi/access/logout";
    logout.textContent = "Sign out";

    bar.appendChild(info);
    bar.appendChild(toggle);
    bar.appendChild(hint);
    bar.appendChild(logout);
    document.body.appendChild(bar);
    document.body.classList.add("has-admin-bar");

    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (f && pendingKey) upload(pendingKey, f);
    });
    document.body.appendChild(fileInput);
  }

  function onIcoClick(e) {
    if (!editMode || !isAdmin) return;
    e.preventDefault();
    pendingKey = this.getAttribute("data-badge");
    if (fileInput) fileInput.click();
  }

  function upload(key, file) {
    if (file.size > 2 * 1024 * 1024) { alert("Image too large — max 2 MB."); return; }
    var ico = document.querySelector('.ico[data-badge="' + key + '"]');
    if (ico) ico.classList.add("uploading");
    fetch("/admin/upload", {
      method: "POST",
      headers: { "x-badge-key": key, "content-type": file.type },
      body: file,
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (ico) ico.classList.remove("uploading");
        if (res.ok && res.j && res.j.ok) {
          manifest[key] = { updatedAt: res.j.updatedAt };
          renderBadge(ico, key, res.j.updatedAt);
        } else {
          alert("Upload failed: " + ((res.j && res.j.error) || "unknown error"));
        }
      })
      .catch(function (err) {
        if (ico) ico.classList.remove("uploading");
        alert("Upload failed: " + err.message);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var icos = keyedIcos();
    for (var i = 0; i < icos.length; i++) icos[i].addEventListener("click", onIcoClick);
    loadBadges(icos);
    checkAdmin();
  });
})();
