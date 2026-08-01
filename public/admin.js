// GP Promach — badge images + admin edit mode with roles.
// Everyone sees uploaded badges. Signed-in Google users are "pending" until the
// owner approves them. Owner/admins get an edit toggle; the owner can manage admins.
(function () {
  var manifest = {};
  var role = null;       // "owner" | "admin" | "pending" | null
  var email = "";
  var editMode = false;
  var fileInput = null;
  var pendingKey = null;

  function keyedIcos() {
    var out = [];
    var sections = document.querySelectorAll("section[id]");
    for (var s = 0; s < sections.length; s++) {
      var icos = sections[s].querySelectorAll(".ico");
      for (var i = 0; i < icos.length; i++) {
        icos[i].setAttribute("data-badge", sections[s].id + "-" + (i + 1));
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

  function checkSession() {
    return fetch("/admin/session", { redirect: "manual", cache: "no-store" })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.role) return;
        role = data.role; email = data.email || "";
        buildBar();
      })
      .catch(function () {});
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildBar() {
    if (document.querySelector(".admin-bar")) return;
    var bar = el("div", "admin-bar");
    var canEdit = role === "owner" || role === "admin";

    var info = el("span", "admin-info",
      (role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Signed in") +
      (email ? " · " + email : ""));
    bar.appendChild(info);

    if (canEdit) {
      var toggle = el("button", "admin-btn", "Turn on edit mode");
      toggle.type = "button";
      toggle.addEventListener("click", function () {
        editMode = !editMode;
        document.body.classList.toggle("edit-mode", editMode);
        toggle.textContent = editMode ? "Turn off edit mode" : "Turn on edit mode";
        hint.style.display = editMode ? "" : "none";
      });
      var hint = el("span", "admin-hint", "Click any badge to upload an image (PNG/JPG/SVG, max 2 MB).");
      hint.style.display = "none";
      bar.appendChild(toggle);
      bar.appendChild(hint);

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
    } else {
      bar.appendChild(el("span", "admin-hint",
        "You don't have edit access yet — ask the owner to approve you."));
    }

    if (role === "owner") {
      var manage = el("button", "admin-btn admin-btn-ghost", "Manage admins");
      manage.type = "button";
      manage.addEventListener("click", openManage);
      bar.appendChild(manage);
    }

    var logout = el("a", "admin-link", "Sign out");
    logout.href = "/cdn-cgi/access/logout";
    bar.appendChild(logout);

    document.body.appendChild(bar);
    document.body.classList.add("has-admin-bar");
  }

  function onIcoClick(e) {
    if (!editMode || !(role === "owner" || role === "admin")) return;
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

  // ---- Owner: manage admins ----
  function openManage() {
    var overlay = el("div", "admin-modal-overlay");
    var panel = el("div", "admin-modal");
    panel.appendChild(el("h3", null, "Manage admins"));
    var body = el("div", "admin-modal-body", "Loading…");
    panel.appendChild(body);

    var addRow = el("div", "admin-add-row");
    var input = document.createElement("input");
    input.type = "email";
    input.placeholder = "name@gmail.com";
    input.className = "admin-add-input";
    var addBtn = el("button", "admin-btn", "Add admin");
    addBtn.type = "button";
    addBtn.addEventListener("click", function () {
      var e = (input.value || "").trim();
      if (!e) return;
      post("/admin/admins/add", { email: e }).then(function () { input.value = ""; refresh(body); });
    });
    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    panel.appendChild(addRow);

    var close = el("button", "admin-btn admin-btn-ghost", "Close");
    close.type = "button";
    close.addEventListener("click", function () { document.body.removeChild(overlay); });
    panel.appendChild(close);

    overlay.appendChild(panel);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) document.body.removeChild(overlay); });
    document.body.appendChild(overlay);
    refresh(body);
  }

  function refresh(body) {
    fetch("/admin/admins", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        body.innerHTML = "";
        body.appendChild(sectionList("Approved admins", d.admins || [], "remove"));
        body.appendChild(sectionList("Waiting for approval", d.requests || [], "approve"));
        var owner = el("p", "admin-owner-note", "Owner: " + (d.owner || ""));
        body.appendChild(owner);
      })
      .catch(function () { body.textContent = "Could not load."; });
  }

  function sectionList(title, emails, action) {
    var wrap = el("div", "admin-list");
    wrap.appendChild(el("h4", null, title));
    if (!emails.length) { wrap.appendChild(el("p", "admin-empty", "None")); return wrap; }
    emails.forEach(function (e) {
      var row = el("div", "admin-row");
      row.appendChild(el("span", null, e));
      var btn = el("button", "admin-mini", action === "approve" ? "Approve" : "Remove");
      btn.type = "button";
      btn.addEventListener("click", function () {
        var url = action === "approve" ? "/admin/admins/add" : "/admin/admins/remove";
        post(url, { email: e }).then(function () { refresh(document.querySelector(".admin-modal-body")); });
      });
      row.appendChild(btn);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function post(url, obj) {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(obj),
    }).then(function (r) { return r.json(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var icos = keyedIcos();
    for (var i = 0; i < icos.length; i++) icos[i].addEventListener("click", onIcoClick);
    loadBadges(icos);
    checkSession();
  });
})();
