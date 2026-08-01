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
        setTextEditing(editMode);
      });
      var hint = el("span", "admin-hint",
        "Click a badge to upload an image. Click any heading or paragraph to edit it (saves automatically in the current language). Clear a field to restore its default.");
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

  // ---- Inline text editing ----
  // Editable nodes are [data-i18n] elements the shared gpContent layer marks as
  // editable, excluding nav/brand links (so clicking a link still navigates).
  function editableTextNodes() {
    var out = [];
    if (!window.gpContent) return out;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!window.gpContent.isEditable(n.getAttribute("data-i18n"))) continue;
      if (n.closest("a") || n.closest("nav")) continue;
      out.push(n);
    }
    return out;
  }

  var origText = "";

  // HTML keys (e.g. the hero heading) are edited as rich text — read/write innerHTML;
  // every other key is plain text via textContent.
  function currentVal(node) {
    var key = node.getAttribute("data-i18n");
    return window.gpContent.isHtml(key) ? node.innerHTML.trim() : norm(node.textContent);
  }
  function setVal(node, key, val) {
    if (window.gpContent.isHtml(key)) node.innerHTML = val;
    else node.textContent = val;
  }

  function onTextFocus() { origText = currentVal(this); }

  function onTextKeydown(e) {
    if (e.key === "Enter") { e.preventDefault(); this.blur(); }
    else if (e.key === "Escape") {
      setVal(this, this.getAttribute("data-i18n"), origText);
      this.blur();
    }
  }

  function onTextPaste(e) {
    e.preventDefault();
    var t = ((e.clipboardData || window.clipboardData).getData("text") || "");
    document.execCommand("insertText", false, t);
  }

  function onTextBlur() {
    var key = this.getAttribute("data-i18n");
    var value = currentVal(this);
    var prev = origText;
    if (value === prev) return;
    var lang = window.gpContent.getLang();
    // Clearing a field out restores the default (removes the override).
    if (!norm(this.textContent)) { saveText(lang, key, "", prev, this); return; }
    saveText(lang, key, value, prev, this);
  }

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  function saveText(lang, key, value, prev, node) {
    node.classList.add("saving");
    post("/admin/content", { lang: lang, key: key, value: value })
      .then(function (res) {
        node.classList.remove("saving");
        if (res && res.ok) {
          window.gpContent.setOverride(lang, key, value);
        } else {
          setVal(node, key, prev);
          alert("Save failed: " + ((res && res.error) || "unknown error"));
        }
      })
      .catch(function (err) {
        node.classList.remove("saving");
        setVal(node, key, prev);
        alert("Save failed: " + err.message);
      });
  }

  function setTextEditing(on) {
    var nodes = editableTextNodes();
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (on) {
        n.setAttribute("contenteditable", "true");
        n.setAttribute("spellcheck", "false");
        n.addEventListener("focus", onTextFocus);
        n.addEventListener("blur", onTextBlur);
        n.addEventListener("keydown", onTextKeydown);
        n.addEventListener("paste", onTextPaste);
      } else {
        n.removeAttribute("contenteditable");
        n.removeAttribute("spellcheck");
        n.removeEventListener("focus", onTextFocus);
        n.removeEventListener("blur", onTextBlur);
        n.removeEventListener("keydown", onTextKeydown);
        n.removeEventListener("paste", onTextPaste);
      }
    }
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
