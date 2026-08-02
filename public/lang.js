/* Simple EN/TH language switcher for GP Promach.
   Default language is English. Choice is remembered in localStorage. */
(function () {
  var dict = {
    en: {
      nav_tagline: "Machinery & Factory Equipment",
      nav_home: "Home",
      nav_capabilities: "Services",
      nav_installation: "Installation",
      nav_design: "Design",
      nav_trading: "Trading & Sourcing",
      nav_catalogs: "Catalogs",
      nav_contact: "Contact",

      hero_eyebrow: "Machinery & factory equipment",
      hero_h1: 'Machinery, installed to <span class="accent">run.</span><br />Maintained to last.',
      hero_p: "GP Promach installs, maintains, and builds machinery and factory equipment — and trades and sources the machines and parts you need, from a single partner.",
      hero_cta: "Request a quote",
      hero_link: "See what we do →",

      cap_eyebrow: "What we do",
      cap_h2: "Everything your factory needs, under one roof.",
      cap_p: "From installing a single machine to running your maintenance, building custom equipment, and sourcing hard-to-find parts — we cover it end to end.",
      c1_h: "Machinery Installation",
      c1_p: "Positioning, alignment, hook-up, and commissioning of machines and full production lines.",
      c2_h: "Maintenance & Repair",
      c2_p: "Preventive maintenance, breakdown repair, and overhauls that keep your equipment running.",
      c3_h: "Machine Building & Fabrication",
      c3_p: "Custom-built machinery, jigs, and steel structures fabricated to your requirements.",
      c4_h: "Machinery Trading",
      c4_p: "New and used machines and factory equipment, supplied to suit your budget and needs.",
      c5_h: "Sourcing & Import",
      c5_p: "We locate, source, and import the machines, parts, and equipment you can't find locally.",
      c6_h: "Spare Parts Supply",
      c6_p: "Genuine and compatible spare parts kept available to keep downtime to a minimum.",

      inst_eyebrow: "Installation",
      inst_h2: "Installed right, running from day one.",
      inst_p: "Our team brings machines and equipment on site, installs and aligns them, and makes sure everything runs before we hand over.",
      i1_h: "On-site Installation",
      i1_p: "We install and align machines and full production lines at your facility, around your schedule.",
      i2_h: "Alignment & Levelling",
      i2_p: "Precise levelling, alignment, and connection so machines run true from the start.",
      i3_h: "Commissioning & Testing",
      i3_p: "Functional checks and commissioning so your equipment performs correctly from day one.",
      i4_h: "Relocation & Setup",
      i4_p: "Safe dismantling, moving, and re-installation of machines and production lines.",

      trade_eyebrow: "Trading & Sourcing",
      trade_h2: "More than installers — your equipment partner.",
      trade_p: "We trade and source machines, equipment, and spare parts — so you can get the whole factory from a single partner.",
      t1_h: "New & Used Machinery",
      t1_p: "Quality new and pre-owned machines and factory equipment, matched to your budget.",
      t2_h: "Spare Parts & Components",
      t2_p: "Motors, bearings, drives, and genuine spare parts supplied on demand.",
      t3_h: "Global Sourcing & Import",
      t3_p: "Hard-to-find machines and equipment located and imported end to end.",
      t4_h: "Consumables & Supplies",
      t4_p: "Everyday factory consumables and supplies kept flowing so your lines don't stop.",

      design_eyebrow: "Design & Engineering",
      design_h2: "Machines designed around your process.",
      design_p: "Before we build or install, we design — custom machinery, equipment, and fixtures engineered to fit the way your factory works.",
      d1_h: "Machine & Equipment Design",
      d1_p: "Custom machine and equipment design tailored to your process and your space.",
      d2_h: "3D CAD & Modelling",
      d2_p: "Detailed 3D models and technical drawings, ready for fabrication.",
      d3_h: "Concept & Prototyping",
      d3_p: "Concept development and prototypes to prove out ideas before the full build.",
      d4_h: "Design Consultation",
      d4_p: "Engineering advice to improve, adapt, or upgrade your existing machinery.",

      foot_desc: "Installation, maintenance, building, trading, and sourcing of machinery and factory equipment. Si Racha, Chonburi, Thailand.",
      foot_company: "Company",
      foot_copy: "© 2026 GP Promach Co., Ltd. All rights reserved.",

      contact_eyebrow: "Get in touch",
      contact_h1: "Have a project for us?",
      contact_p: "Tell us about your machine, equipment, or factory project and we'll come back with a price and timeline — usually within a day. Reach either of us directly.",
      contact_addr: '<strong>GP Promach Co., Ltd.</strong><br />115/58 Moo 10, Nong Kham, Si Racha, Chonburi 20230, Thailand',
      contact_back: "← Back to home",

      p1_role: "Contact",
      p1_name: "Ekkaphong Rotruedi",
      p1_th: "เอกพงศ์ รอดฤดี",
      p1_phone: "099-326-9632",
      p1_email: "ekkaphongdm@gmail.com",
      p2_role: "Contact",
      p2_name: "Sompong Rakna",
      p2_th: "สมพงษ์ รักนา",
      p2_phone: "092-152-2226",
      p2_email: "pongrakna99@gmail.com",
      foot_c1: "099-326-9632 · Ekkaphong",
      foot_c2: "092-152-2226 · Sompong",
      foot_c3: "ekkaphongdm@gmail.com",
      foot_c4: "pongrakna99@gmail.com",

      title_home: "GP Promach — Machinery & Factory Equipment",
      title_contact: "Contact — GP Promach"
    },
    th: {
      nav_tagline: "เครื่องจักรและอุปกรณ์โรงงาน",
      nav_home: "หน้าแรก",
      nav_capabilities: "บริการ",
      nav_installation: "การติดตั้ง",
      nav_design: "ออกแบบ",
      nav_trading: "การค้าและการจัดหา",
      nav_catalogs: "แคตตาล็อก",
      nav_contact: "ติดต่อ",

      hero_eyebrow: "เครื่องจักรและอุปกรณ์โรงงาน",
      hero_h1: 'เครื่องจักร ติดตั้งให้<span class="accent">พร้อมเดินเครื่อง</span><br />ดูแลให้ใช้งานได้ยาวนาน',
      hero_p: "GP Promach ติดตั้ง บำรุงรักษา และสร้างเครื่องจักรและอุปกรณ์โรงงาน พร้อมทั้งจัดจำหน่ายและจัดหาเครื่องจักรและอะไหล่ที่คุณต้องการ ครบจบในที่เดียว",
      hero_cta: "ขอใบเสนอราคา",
      hero_link: "ดูบริการของเรา →",

      cap_eyebrow: "สิ่งที่เราทำ",
      cap_h2: "ทุกสิ่งที่โรงงานของคุณต้องการ ครบในที่เดียว",
      cap_p: "ตั้งแต่การติดตั้งเครื่องจักรเครื่องเดียว ไปจนถึงดูแลงานบำรุงรักษา สร้างอุปกรณ์ตามสั่ง และจัดหาอะไหล่ที่หายาก — เราดูแลให้ครบวงจร",
      c1_h: "ติดตั้งเครื่องจักร",
      c1_p: "จัดวาง ปรับแนว เชื่อมต่อระบบ และเดินเครื่องทดสอบ ทั้งเครื่องจักรเดี่ยวและไลน์การผลิตทั้งระบบ",
      c2_h: "บำรุงรักษาและซ่อม",
      c2_p: "งานบำรุงรักษาเชิงป้องกัน ซ่อมเมื่อเครื่องเสีย และยกเครื่องซ่อมใหญ่ เพื่อให้อุปกรณ์ทำงานได้ต่อเนื่อง",
      c3_h: "สร้างและผลิตเครื่องจักร",
      c3_p: "สร้างเครื่องจักร จิ๊ก และโครงสร้างเหล็กตามความต้องการของคุณ",
      c4_h: "ซื้อขายเครื่องจักร",
      c4_p: "เครื่องจักรและอุปกรณ์โรงงานทั้งใหม่และมือสอง จัดหาให้เหมาะกับงบประมาณและความต้องการ",
      c5_h: "จัดหาและนำเข้า",
      c5_p: "เราค้นหา จัดหา และนำเข้าเครื่องจักร อะไหล่ และอุปกรณ์ที่หาไม่ได้ในประเทศ",
      c6_h: "จัดหาอะไหล่",
      c6_p: "อะไหล่แท้และอะไหล่เทียบเท่า พร้อมจัดหาเพื่อลดเวลาที่เครื่องหยุดทำงานให้น้อยที่สุด",

      inst_eyebrow: "การติดตั้ง",
      inst_h2: "ติดตั้งอย่างถูกต้อง เดินเครื่องได้ตั้งแต่วันแรก",
      inst_p: "ทีมงานของเรานำเครื่องจักรและอุปกรณ์เข้าหน้างาน ติดตั้งและปรับแนวให้ และตรวจสอบให้ทุกอย่างเดินเครื่องได้ก่อนส่งมอบ",
      i1_h: "ติดตั้งถึงหน้างาน",
      i1_p: "เราติดตั้งและปรับแนวเครื่องจักรและไลน์การผลิตถึงโรงงานของคุณ ตามตารางเวลาที่คุณสะดวก",
      i2_h: "ปรับแนวและปรับระดับ",
      i2_p: "ปรับระดับ ปรับแนว และเชื่อมต่ออย่างแม่นยำ เพื่อให้เครื่องจักรทำงานได้เที่ยงตรงตั้งแต่เริ่ม",
      i3_h: "ทดสอบและเดินเครื่อง",
      i3_p: "ตรวจสอบการทำงานและเดินเครื่อง เพื่อให้อุปกรณ์ของคุณทำงานได้อย่างถูกต้องตั้งแต่วันแรก",
      i4_h: "ย้ายและติดตั้งใหม่",
      i4_p: "ถอด ย้าย และติดตั้งเครื่องจักรและไลน์การผลิตใหม่อย่างปลอดภัย",

      trade_eyebrow: "การค้าและการจัดหา",
      trade_h2: "มากกว่าผู้ติดตั้ง — พาร์ทเนอร์ด้านเครื่องจักรของคุณ",
      trade_p: "เราจัดจำหน่ายและจัดหาเครื่องจักร อุปกรณ์ และอะไหล่ ให้คุณจัดการทั้งโรงงานได้จากพาร์ทเนอร์รายเดียว",
      t1_h: "เครื่องจักรใหม่และมือสอง",
      t1_p: "เครื่องจักรและอุปกรณ์โรงงานคุณภาพทั้งใหม่และมือสอง จัดให้เหมาะกับงบประมาณ",
      t2_h: "อะไหล่และชิ้นส่วน",
      t2_p: "มอเตอร์ ตลับลูกปืน ชุดขับ และอะไหล่แท้ จัดหาตามความต้องการ",
      t3_h: "จัดหาและนำเข้าจากต่างประเทศ",
      t3_p: "ค้นหาและนำเข้าเครื่องจักรและอุปกรณ์ที่หายากให้ครบวงจร",
      t4_h: "วัสดุสิ้นเปลืองและของใช้ในโรงงาน",
      t4_p: "วัสดุสิ้นเปลืองและของใช้ในโรงงานประจำวัน จัดส่งต่อเนื่องเพื่อให้ไลน์ผลิตไม่หยุด",

      design_eyebrow: "ออกแบบและวิศวกรรม",
      design_h2: "ออกแบบเครื่องจักรให้เหมาะกับกระบวนการของคุณ",
      design_p: "ก่อนสร้างหรือติดตั้ง เราออกแบบก่อน — เครื่องจักร อุปกรณ์ และจิ๊กเฉพาะงาน ที่ออกแบบให้เข้ากับการทำงานของโรงงานคุณ",
      d1_h: "ออกแบบเครื่องจักรและอุปกรณ์",
      d1_p: "ออกแบบเครื่องจักรและอุปกรณ์เฉพาะงาน ให้เหมาะกับกระบวนการและพื้นที่ของคุณ",
      d2_h: "ออกแบบ 3D และแบบทางเทคนิค",
      d2_p: "โมเดล 3D และแบบเขียนทางเทคนิคอย่างละเอียด พร้อมสำหรับการผลิต",
      d3_h: "พัฒนาแนวคิดและต้นแบบ",
      d3_p: "พัฒนาแนวคิดและสร้างต้นแบบเพื่อพิสูจน์ไอเดียก่อนลงมือสร้างจริง",
      d4_h: "ให้คำปรึกษาด้านการออกแบบ",
      d4_p: "ให้คำแนะนำทางวิศวกรรมเพื่อปรับปรุง ดัดแปลง หรืออัปเกรดเครื่องจักรเดิมของคุณ",

      foot_desc: "ติดตั้ง บำรุงรักษา สร้าง จัดจำหน่าย และจัดหาเครื่องจักรและอุปกรณ์โรงงาน ศรีราชา ชลบุรี ประเทศไทย",
      foot_company: "บริษัท",
      foot_copy: "© 2026 บริษัท จีพี โปรแมค จำกัด สงวนลิขสิทธิ์",

      contact_eyebrow: "ติดต่อเรา",
      contact_h1: "มีงานให้เราดูแลไหม?",
      contact_p: "เล่าเรื่องเครื่องจักร อุปกรณ์ หรือโครงการโรงงานของคุณให้เราฟัง แล้วเราจะแจ้งราคาและระยะเวลากลับไป — โดยปกติภายในหนึ่งวัน ติดต่อเราคนใดคนหนึ่งได้โดยตรง",
      contact_addr: '<strong>บริษัท จีพี โปรแมค จำกัด</strong><br />115/58 หมู่ 10 ตำบลหนองขาม อำเภอศรีราชา จังหวัดชลบุรี 20230 ประเทศไทย',
      contact_back: "← กลับหน้าแรก",

      p1_role: "ติดต่อ",
      p1_name: "Ekkaphong Rotruedi",
      p1_th: "เอกพงศ์ รอดฤดี",
      p1_phone: "099-326-9632",
      p1_email: "ekkaphongdm@gmail.com",
      p2_role: "ติดต่อ",
      p2_name: "Sompong Rakna",
      p2_th: "สมพงษ์ รักนา",
      p2_phone: "092-152-2226",
      p2_email: "pongrakna99@gmail.com",
      foot_c1: "099-326-9632 · Ekkaphong",
      foot_c2: "092-152-2226 · Sompong",
      foot_c3: "ekkaphongdm@gmail.com",
      foot_c4: "pongrakna99@gmail.com",

      title_home: "GP Promach — เครื่องจักรและอุปกรณ์โรงงาน",
      title_contact: "ติดต่อ — GP Promach"
    }
  };

  // Keys whose default value contains intentional markup — rendered with innerHTML.
  // Everything else is rendered as plain text (and is safely admin-editable).
  var HTML_KEYS = { hero_h1: 1, contact_addr: 1 };

  // Keys an admin may NOT edit inline: nav labels, brand tagline, and the <title>s.
  // Everything else in the dict is editable copy (the HTML_KEYS above are edited as
  // rich text and sanitized server-side; all others are plain text).
  var NON_EDITABLE = {
    nav_home: 1, nav_capabilities: 1, nav_installation: 1,
    nav_trading: 1, nav_contact: 1, nav_tagline: 1,
    title_home: 1, title_contact: 1,
  };

  // Admin text overrides, layered on top of the dict per language.
  var overrides = { en: {}, th: {} };

  // Keys for admin-created cards ("<id>:h" / "<id>:p") have no dict default —
  // their text is the stored override itself.
  var DYN_RE = /^c_[a-z0-9]{6,}:(h|p)$/;

  var current = "en";
  try {
    var saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "th") current = saved;
  } catch (e) {}

  function effective(lang, key) {
    var o = overrides[lang];
    if (o && o[key] != null) return o[key];
    var table = dict[lang] || dict.en;
    return table[key];
  }

  function render(node, key, val) {
    if (val == null) return;
    if (HTML_KEYS[key]) node.innerHTML = val;
    else node.textContent = val;
  }

  // Keep contact tel:/mailto: links pointing at their (possibly edited) text.
  function updateLinks() {
    var links = document.querySelectorAll("a[data-link]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var span = a.querySelector("[data-i18n]");
      if (!span) continue;
      var val = (span.textContent || "").trim();
      if (!val) continue;
      if (a.getAttribute("data-link") === "tel") {
        var digits = val.replace(/[^0-9+]/g, "");
        if (digits.charAt(0) === "0") digits = "+66" + digits.slice(1); // Thai local -> intl
        a.href = "tel:" + digits;
      } else if (a.getAttribute("data-link") === "mail") a.href = "mailto:" + val;
    }
  }

  function apply(lang) {
    current = lang;
    var table = dict[lang] || dict.en;
    document.documentElement.lang = lang;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      render(nodes[i], key, effective(lang, key));
    }
    updateLinks();

    var titleKey = document.body.getAttribute("data-title");
    if (titleKey && table[titleKey]) document.title = table[titleKey];

    var buttons = document.querySelectorAll("[data-lang-toggle]");
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].textContent = lang === "en" ? "ไทย" : "EN";
      buttons[j].setAttribute(
        "aria-label",
        lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"
      );
    }

    try { localStorage.setItem("lang", lang); } catch (e) {}
  }

  function wireMobileMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var links = document.querySelector(".navlinks");
    if (!toggle || !links) return;

    // Reset the inline styles back to the stylesheet: closes the menu on mobile,
    // and is a no-op on desktop (where the nav is shown via CSS).
    function closeMenu() {
      links.style.display = "";
      links.style.position = "";
      links.style.flexDirection = "";
      links.style.top = "";
      links.style.left = "";
      links.style.right = "";
      links.style.background = "";
      links.style.padding = "";
      links.style.gap = "";
      links.style.borderBottom = "";
    }

    toggle.addEventListener("click", function () {
      if (links.style.display === "flex") { closeMenu(); return; }
      links.style.display = "flex";
      links.style.position = "absolute";
      links.style.flexDirection = "column";
      links.style.top = "64px";
      links.style.left = "0";
      links.style.right = "0";
      links.style.background = "#fff";
      links.style.padding = "18px 24px";
      links.style.gap = "18px";
      links.style.borderBottom = "1px solid var(--line)";
    });

    // Close the open menu once a nav item is tapped.
    var items = links.querySelectorAll("a");
    for (var i = 0; i < items.length; i++) items[i].addEventListener("click", closeMenu);
  }

  function loadContent() {
    return fetch("/api/content", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        overrides.en = d.en && typeof d.en === "object" ? d.en : {};
        overrides.th = d.th && typeof d.th === "object" ? d.th : {};
        apply(current);
      })
      .catch(function () {});
  }

  // Shared API for the admin edit layer (admin.js). Lets the editor read the
  // active language, ask which keys are editable, and push saved text back into
  // the in-memory overrides so every node with that key re-renders immediately.
  window.gpContent = {
    getLang: function () { return current; },
    isEditable: function (key) {
      if (DYN_RE.test(key)) return true;
      return !NON_EDITABLE[key] && dict.en[key] != null;
    },
    isHtml: function (key) { return !!HTML_KEYS[key]; },
    refresh: function () { apply(current); },
    hasOverride: function (lang, key) {
      return !!(overrides[lang] && overrides[lang][key] != null);
    },
    setOverride: function (lang, key, value) {
      if (!overrides[lang]) overrides[lang] = {};
      if (value != null && value !== "") overrides[lang][key] = value;
      else delete overrides[lang][key];
      if (lang === current) {
        var nodes = document.querySelectorAll('[data-i18n="' + key + '"]');
        for (var i = 0; i < nodes.length; i++) render(nodes[i], key, effective(current, key));
        updateLinks();
      }
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    apply(current);
    loadContent();
    var buttons = document.querySelectorAll("[data-lang-toggle]");
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].addEventListener("click", function () {
        apply(current === "en" ? "th" : "en");
      });
    }
    wireMobileMenu();
  });
})();
