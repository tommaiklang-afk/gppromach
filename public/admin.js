// GP Promach — badge images + admin edit mode with roles.
// Everyone sees uploaded badges. Signed-in Google users are "pending" until the
// owner approves them. Owner/admins get an edit toggle; the owner can manage admins.
(function () {
  var manifest = {};
  var cards = {};        // { section: [cardId, ...] } — admin-created cards
  var role = null;       // "owner" | "admin" | "pending" | null
  var email = "";
  var editMode = false;
  var fileInput = null;
  var pendingKey = null;

  var CARD_SECTIONS = ["capabilities", "installation", "design", "trading"];

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

  // Render every badge slot currently in the DOM (built-in and dynamic cards).
  function applyManifest() {
    var icos = document.querySelectorAll(".ico[data-badge]");
    for (var i = 0; i < icos.length; i++) {
      var key = icos[i].getAttribute("data-badge");
      if (manifest[key]) renderBadge(icos[i], key, manifest[key].updatedAt);
    }
  }

  function loadBadges() {
    return fetch("/api/badges", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (m) { manifest = m || {}; applyManifest(); })
      .catch(function () {});
  }

  // ---- Admin-created cards ----
  function loadCards() {
    return fetch("/api/cards", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) { cards = d; renderAllCards(); } })
      .catch(function () {});
  }

  function gridFor(section) {
    return document.querySelector("section#" + section + " .grid");
  }

  function insertCard(grid, cardEl) {
    var addTile = grid.querySelector(".gp-add-card");
    if (addTile) grid.insertBefore(cardEl, addTile);
    else grid.appendChild(cardEl);
  }

  function buildCard(id) {
    var card = el("div", "card");
    card.setAttribute("data-dyn", "");
    card.setAttribute("data-card-id", id);

    var ico = el("div", "ico");
    ico.setAttribute("data-badge", id);
    ico.appendChild(document.createElement("span"));
    ico.addEventListener("click", onIcoClick);
    ico.addEventListener("mouseenter", onIcoEnter);
    ico.addEventListener("mouseleave", onIcoLeave);
    card.appendChild(ico);

    var h = el("h3");
    h.setAttribute("data-i18n", id + ":h");
    card.appendChild(h);

    var p = el("p");
    p.setAttribute("data-i18n", id + ":p");
    card.appendChild(p);

    var del = el("button", "gp-card-del", "🗑");
    del.type = "button";
    del.title = "Delete this card";
    del.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      removeCard(id, card);
    });
    card.appendChild(del);

    return card;
  }

  // Re-render all dynamic cards from the current `cards` state.
  function renderAllCards() {
    for (var s = 0; s < CARD_SECTIONS.length; s++) {
      var grid = gridFor(CARD_SECTIONS[s]);
      if (!grid) continue;
      var existing = grid.querySelectorAll(".card[data-dyn]");
      for (var e = 0; e < existing.length; e++) existing[e].parentNode.removeChild(existing[e]);
      var ids = cards[CARD_SECTIONS[s]] || [];
      for (var i = 0; i < ids.length; i++) insertCard(grid, buildCard(ids[i]));
    }
    applyManifest();
    if (window.gpContent) window.gpContent.refresh();
    if (editMode) setTextEditing(true);
  }

  // "+ Add card" tiles, one per section (created for editors, shown in edit mode).
  function setupAddTiles() {
    for (var s = 0; s < CARD_SECTIONS.length; s++) {
      var section = CARD_SECTIONS[s];
      var grid = gridFor(section);
      if (!grid || grid.querySelector(".gp-add-card")) continue;
      var btn = el("button", "gp-add-card", "+ Add card");
      btn.type = "button";
      btn.setAttribute("data-section", section);
      btn.addEventListener("click", function () { addCard(this.getAttribute("data-section")); });
      grid.appendChild(btn);
    }
  }

  function addCard(section) {
    post("/admin/cards/add", { section: section })
      .then(function (res) {
        if (!res || !res.ok) { alert("Add failed: " + ((res && res.error) || "unknown error")); return; }
        var id = res.id;
        if (!cards[section]) cards[section] = [];
        cards[section].push(id);
        if (window.gpContent) {
          window.gpContent.setOverride("en", id + ":h", res.h);
          window.gpContent.setOverride("en", id + ":p", res.p);
          window.gpContent.setOverride("th", id + ":h", res.h);
          window.gpContent.setOverride("th", id + ":p", res.p);
        }
        var card = buildCard(id);
        insertCard(gridFor(section), card);
        if (window.gpContent) window.gpContent.refresh();
        if (editMode) setTextEditing(true);
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function (err) { alert("Add failed: " + err.message); });
  }

  function removeCard(id, cardEl) {
    if (!window.confirm("Delete this card? This can't be undone.")) return;
    post("/admin/cards/remove", { id: id })
      .then(function (res) {
        if (!res || !res.ok) { alert("Delete failed: " + ((res && res.error) || "unknown error")); return; }
        for (var s = 0; s < CARD_SECTIONS.length; s++) {
          var list = cards[CARD_SECTIONS[s]] || [];
          var i = list.indexOf(id);
          if (i !== -1) list.splice(i, 1);
        }
        delete manifest[id];
        if (window.gpContent) {
          window.gpContent.setOverride("en", id + ":h", "");
          window.gpContent.setOverride("en", id + ":p", "");
          window.gpContent.setOverride("th", id + ":h", "");
          window.gpContent.setOverride("th", id + ":p", "");
        }
        if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
      })
      .catch(function (err) { alert("Delete failed: " + err.message); });
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
        if (!editMode) hideBadgeBtn(true);
      });
      var hint = el("span", "admin-hint",
        "Click a badge panel to add or replace its image (hover it and click ✕ Remove to clear it). Click any heading or paragraph to edit it — saved in the current language. Use \"+ Add card\" to add a new service card, or 🗑 to delete one.");
      hint.style.display = "none";
      bar.appendChild(toggle);
      bar.appendChild(hint);
      setupAddTiles();

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

  // ---- Badge remove (floating ✕ button on hover) ----
  var badgeBtn = null;
  var badgeTarget = null;
  var badgeHideTimer = null;

  function onIcoEnter() {
    if (!editMode || !(role === "owner" || role === "admin")) return;
    showBadgeBtn(this);
  }
  function onIcoLeave() { hideBadgeBtn(); }

  function ensureBadgeBtn() {
    if (badgeBtn) return badgeBtn;
    badgeBtn = el("button", "gp-badge-remove", "✕ Remove");
    badgeBtn.type = "button";
    badgeBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
    badgeBtn.addEventListener("mouseenter", function () { clearTimeout(badgeHideTimer); });
    badgeBtn.addEventListener("mouseleave", function () { hideBadgeBtn(); });
    badgeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (badgeTarget) removeBadge(badgeTarget);
    });
    document.body.appendChild(badgeBtn);
    return badgeBtn;
  }

  function showBadgeBtn(ico) {
    var key = ico.getAttribute("data-badge");
    if (!manifest[key]) { hideBadgeBtn(true); return; } // nothing to remove
    clearTimeout(badgeHideTimer);
    badgeTarget = ico;
    var btn = ensureBadgeBtn();
    btn.classList.add("show");
    var r = ico.getBoundingClientRect();
    btn.style.left = (r.left + window.pageXOffset + r.width - 8) + "px";
    btn.style.top = (r.top + window.pageYOffset + 8) + "px";
  }

  function hideBadgeBtn(now) {
    clearTimeout(badgeHideTimer);
    if (now) { if (badgeBtn) badgeBtn.classList.remove("show"); badgeTarget = null; return; }
    badgeHideTimer = setTimeout(function () {
      if (badgeBtn) badgeBtn.classList.remove("show");
      badgeTarget = null;
    }, 140);
  }

  function removeBadge(ico) {
    var key = ico.getAttribute("data-badge");
    hideBadgeBtn(true);
    ico.classList.add("uploading");
    fetch("/admin/delete", { method: "POST", headers: { "x-badge-key": key } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        ico.classList.remove("uploading");
        if (res.ok && res.j && res.j.ok) {
          delete manifest[key];
          clearBadge(ico);
        } else {
          alert("Remove failed: " + ((res.j && res.j.error) || "unknown error"));
        }
      })
      .catch(function (err) {
        ico.classList.remove("uploading");
        alert("Remove failed: " + err.message);
      });
  }

  // Revert an .ico back to its empty placeholder square.
  function clearBadge(ico) {
    var img = ico.querySelector("img.badge-img");
    if (img) img.parentNode.removeChild(img);
    if (!ico.querySelector("span")) ico.appendChild(document.createElement("span"));
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
          // Keep the blur baseline in sync so a still-focused field (e.g. after a
          // reset) doesn't re-save its now-default text on the next blur.
          if (document.activeElement === node) origText = currentVal(node);
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
        n.addEventListener("mouseenter", onNodeEnter);
        n.addEventListener("mouseleave", onNodeLeave);
      } else {
        n.removeAttribute("contenteditable");
        n.removeAttribute("spellcheck");
        n.removeEventListener("focus", onTextFocus);
        n.removeEventListener("blur", onTextBlur);
        n.removeEventListener("keydown", onTextKeydown);
        n.removeEventListener("paste", onTextPaste);
        n.removeEventListener("mouseenter", onNodeEnter);
        n.removeEventListener("mouseleave", onNodeLeave);
      }
    }
    if (!on) hideReset(true);
  }

  // ---- Reset-to-default chip ----
  // A single floating button that appears over an edited field (one that currently
  // has an override) and clears it back to the dictionary default on click.
  var resetBtn = null;
  var resetTarget = null;
  var hideTimer = null;

  function ensureResetBtn() {
    if (resetBtn) return resetBtn;
    resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "gp-reset-btn";
    resetBtn.textContent = "↺ Reset";
    // Prevent the field from blurring (and saving) when the button is pressed.
    resetBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
    resetBtn.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
    resetBtn.addEventListener("mouseleave", function () { hideReset(); });
    resetBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (resetTarget) resetField(resetTarget);
    });
    document.body.appendChild(resetBtn);
    return resetBtn;
  }

  function onNodeEnter() { showReset(this); }
  function onNodeLeave() { hideReset(); }

  function showReset(node) {
    var key = node.getAttribute("data-i18n");
    // Admin-created card text has no built-in default, so "reset" doesn't apply.
    if (/^c_[a-z0-9]{6,}:(h|p)$/.test(key)) { hideReset(); return; }
    if (!window.gpContent.hasOverride(window.gpContent.getLang(), key)) { hideReset(); return; }
    clearTimeout(hideTimer);
    resetTarget = node;
    var btn = ensureResetBtn();
    btn.classList.add("show");
    var r = node.getBoundingClientRect();
    btn.style.left = (r.left + window.pageXOffset + r.width) + "px";
    btn.style.top = (r.top + window.pageYOffset - 32) + "px";
  }

  function hideReset(now) {
    clearTimeout(hideTimer);
    if (now) { if (resetBtn) resetBtn.classList.remove("show"); resetTarget = null; return; }
    hideTimer = setTimeout(function () {
      if (resetBtn) resetBtn.classList.remove("show");
      resetTarget = null;
    }, 140);
  }

  function resetField(node) {
    var key = node.getAttribute("data-i18n");
    var lang = window.gpContent.getLang();
    hideReset(true);
    saveText(lang, key, "", currentVal(node), node);
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
    for (var i = 0; i < icos.length; i++) {
      icos[i].addEventListener("click", onIcoClick);
      icos[i].addEventListener("mouseenter", onIcoEnter);
      icos[i].addEventListener("mouseleave", onIcoLeave);
    }
    loadBadges();
    loadCards();
    checkSession();
  });
})();
