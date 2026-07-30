/* Simple EN/TH language switcher for GP Promach.
   Default language is English. Choice is remembered in localStorage. */
(function () {
  var dict = {
    en: {
      nav_tagline: "Precision CNC Machining",
      nav_home: "Home",
      nav_capabilities: "Capabilities",
      nav_process: "Process",
      nav_installation: "Installation",
      nav_contact: "Contact",

      hero_eyebrow: "Prototype to production",
      hero_h1: 'Machined to the <span class="accent">micron.</span><br />Delivered on time.',
      hero_p: "GP Promach turns your drawings into precision-machined parts — tight tolerances, clean finishes, and repeatable quality across every run.",
      hero_cta: "Request a quote",
      hero_link: "See our capabilities →",

      spec_tol: "Achievable tolerance",
      spec_mill_num: "5-axis",
      spec_mill: "Milling & turning",
      spec_mat: "Materials machined",
      spec_parts: "Parts per order",

      cap_eyebrow: "Capabilities",
      cap_h2: "Our mission",
      cap_p: '"Make your dreams come true."',
      c1_h: "CNC Milling",
      c1_p: "3-, 4-, and 5-axis milling for complex geometries, pockets, and contoured surfaces held to tight tolerances.",
      c2_h: "CNC Turning",
      c2_p: "Precision turned parts, shafts, and threaded components with live tooling for combined milling and turning.",
      c3_h: "Prototyping",
      c3_p: "Fast, accurate one-off and low-volume parts so you can validate a design before committing to production.",
      c4_h: "Production Runs",
      c4_p: "Repeatable batch machining with documented process control, so part #1 and part #10,000 match.",
      c5_h: "Finishing",
      c5_p: "Deburring, anodizing, plating, and surface treatments coordinated in-house so parts arrive ready to use.",
      c6_h: "Inspection",
      c6_p: "Dimensional inspection and reporting on every job, with full traceability when your application demands it.",

      proc_eyebrow: "How it works",
      proc_h2: "From drawing to doorstep.",
      proc_p: "A clear four-step path with a real person on your job from quote to delivery.",
      s1_n: "Step 01",
      s1_h: "Send your files",
      s1_p: "Upload a drawing or 3D model. We review geometry, tolerances, and material.",
      s2_n: "Step 02",
      s2_h: "Get a quote",
      s2_p: "A firm price and lead time — typically within one business day.",
      s3_n: "Step 03",
      s3_h: "We machine it",
      s3_p: "Your parts are cut, finished, and inspected against your spec.",
      s4_n: "Step 04",
      s4_h: "Delivered",
      s4_p: "Inspected parts shipped to your door, ready to install or assemble.",

      inst_eyebrow: "Installation",
      inst_h2: "We don't just make it — we install it.",
      inst_p: "Our team can bring finished parts and assemblies on site, fit them, and make sure everything runs before we hand it over.",
      i1_h: "On-site Installation",
      i1_p: "We install and fit machined components and assemblies at your facility, working around your schedule.",
      i2_h: "Assembly & Fit-up",
      i2_p: "Precise assembly and fit-up of parts on site, so tolerances and alignment are right the first time.",
      i3_h: "Commissioning & Testing",
      i3_p: "Functional checks and commissioning so your equipment performs correctly from day one.",
      i4_h: "Maintenance & Support",
      i4_p: "Ongoing maintenance, adjustments, and replacement parts to keep everything running smoothly.",

      foot_desc: "Precision CNC machining from prototype to production. Si Racha, Chonburi, Thailand.",
      foot_company: "Company",
      foot_copy: "© 2026 GP Promach Co., Ltd. All rights reserved.",

      contact_eyebrow: "Get in touch",
      contact_h1: "Have a part to make?",
      contact_p: "Send us your drawing and we'll come back with a price and lead time — usually within a day. Reach either of us directly.",
      contact_addr: '<strong>GP Promach Co., Ltd.</strong><br />115/58 Moo 10, Nong Kham, Si Racha, Chonburi 20230, Thailand',
      contact_back: "← Back to home",

      title_home: "GP Promach — Precision CNC Machining",
      title_contact: "Contact — GP Promach"
    },
    th: {
      nav_tagline: "งานกลึง CNC ความแม่นยำสูง",
      nav_home: "หน้าแรก",
      nav_capabilities: "ความสามารถ",
      nav_process: "ขั้นตอน",
      nav_installation: "การติดตั้ง",
      nav_contact: "ติดต่อ",

      hero_eyebrow: "ตั้งแต่ต้นแบบจนถึงการผลิตจริง",
      hero_h1: 'แม่นยำระดับ<span class="accent">ไมครอน</span><br />ส่งงานตรงเวลา',
      hero_p: "GP Promach เปลี่ยนแบบของคุณให้เป็นชิ้นงานกลึงที่แม่นยำ — ค่าพิกัดเที่ยงตรง ผิวงานเรียบเนียน และคุณภาพสม่ำเสมอทุกล็อต",
      hero_cta: "ขอใบเสนอราคา",
      hero_link: "ดูความสามารถของเรา →",

      spec_tol: "ค่าพิกัดที่ทำได้",
      spec_mill_num: "5 แกน",
      spec_mill: "งานกัดและกลึง",
      spec_mat: "วัสดุที่กลึงได้",
      spec_parts: "จำนวนชิ้นต่อออเดอร์",

      cap_eyebrow: "ความสามารถ",
      cap_h2: "พันธกิจของเรา",
      cap_p: '"ทำให้ความฝันของคุณเป็นจริง"',
      c1_h: "งานกัด CNC",
      c1_p: "งานกัด 3, 4 และ 5 แกน สำหรับรูปทรงซับซ้อน ช่องร่อง และพื้นผิวโค้ง ควบคุมค่าพิกัดอย่างแม่นยำ",
      c2_h: "งานกลึง CNC",
      c2_p: "ชิ้นงานกลึงแม่นยำ เพลา และชิ้นส่วนเกลียว พร้อมเครื่องมือ live tooling สำหรับงานกัดและกลึงในเครื่องเดียว",
      c3_h: "งานต้นแบบ",
      c3_p: "ชิ้นงานต้นแบบและงานจำนวนน้อย รวดเร็วและแม่นยำ ให้คุณตรวจสอบแบบก่อนเข้าสู่การผลิตจริง",
      c4_h: "งานผลิตจำนวนมาก",
      c4_p: "งานผลิตเป็นล็อตที่ทำซ้ำได้ พร้อมการควบคุมกระบวนการอย่างเป็นระบบ ชิ้นที่ 1 และชิ้นที่ 10,000 เหมือนกัน",
      c5_h: "งานตกแต่งผิว",
      c5_p: "ลบครีบ อโนไดซ์ ชุบเคลือบ และปรับสภาพผิว ดำเนินการครบในที่เดียว ชิ้นงานพร้อมใช้งานทันที",
      c6_h: "การตรวจสอบ",
      c6_p: "ตรวจสอบขนาดและจัดทำรายงานทุกงาน พร้อมระบบตรวจสอบย้อนกลับได้เต็มรูปแบบเมื่อจำเป็น",

      proc_eyebrow: "ขั้นตอนการทำงาน",
      proc_h2: "จากแบบถึงหน้าประตูบ้านคุณ",
      proc_p: "ขั้นตอนชัดเจน 4 ขั้น มีเจ้าหน้าที่ดูแลงานของคุณจริงตั้งแต่เสนอราคาจนถึงส่งมอบ",
      s1_n: "ขั้นที่ 01",
      s1_h: "ส่งไฟล์ของคุณ",
      s1_p: "อัปโหลดแบบหรือโมเดล 3 มิติ เราตรวจสอบรูปทรง ค่าพิกัด และวัสดุให้",
      s2_n: "ขั้นที่ 02",
      s2_h: "รับใบเสนอราคา",
      s2_p: "ราคาและระยะเวลาที่แน่นอน — โดยทั่วไปภายในหนึ่งวันทำการ",
      s3_n: "ขั้นที่ 03",
      s3_h: "เราลงมือผลิต",
      s3_p: "ชิ้นงานของคุณถูกกลึง ตกแต่ง และตรวจสอบตามสเปกที่กำหนด",
      s4_n: "ขั้นที่ 04",
      s4_h: "ส่งมอบ",
      s4_p: "ชิ้นงานที่ผ่านการตรวจสอบ จัดส่งถึงหน้าประตู พร้อมติดตั้งหรือประกอบ",

      inst_eyebrow: "การติดตั้ง",
      inst_h2: "เราไม่ได้แค่ผลิต — เราติดตั้งให้ด้วย",
      inst_p: "ทีมงานของเราสามารถนำชิ้นงานและชุดประกอบที่เสร็จแล้วไปติดตั้งถึงหน้างาน ประกอบให้เข้าที่ และตรวจสอบให้ทุกอย่างทำงานได้ก่อนส่งมอบ",
      i1_h: "ติดตั้งถึงหน้างาน",
      i1_p: "เราติดตั้งและประกอบชิ้นงานและชุดประกอบให้ถึงโรงงานของคุณ ตามตารางเวลาที่คุณสะดวก",
      i2_h: "ประกอบและปรับเข้าที่",
      i2_p: "ประกอบและปรับชิ้นส่วนเข้าที่อย่างแม่นยำถึงหน้างาน ให้ค่าพิกัดและการจัดแนวถูกต้องตั้งแต่ครั้งแรก",
      i3_h: "ทดสอบและเดินเครื่อง",
      i3_p: "ตรวจสอบการทำงานและเดินเครื่อง เพื่อให้อุปกรณ์ของคุณทำงานได้อย่างถูกต้องตั้งแต่วันแรก",
      i4_h: "บำรุงรักษาและดูแล",
      i4_p: "บริการบำรุงรักษา ปรับตั้ง และอะไหล่ทดแทนอย่างต่อเนื่อง เพื่อให้ทุกอย่างทำงานได้อย่างราบรื่น",

      foot_desc: "งานกลึง CNC ความแม่นยำสูง ตั้งแต่ต้นแบบจนถึงการผลิตจริง ศรีราชา ชลบุรี ประเทศไทย",
      foot_company: "บริษัท",
      foot_copy: "© 2026 บริษัท จีพี โปรแมค จำกัด สงวนลิขสิทธิ์",

      contact_eyebrow: "ติดต่อเรา",
      contact_h1: "มีชิ้นงานที่อยากผลิต?",
      contact_p: "ส่งแบบของคุณมาได้เลย เราจะแจ้งราคาและระยะเวลากลับไป — โดยปกติภายในหนึ่งวัน ติดต่อเราคนใดคนหนึ่งได้โดยตรง",
      contact_addr: '<strong>บริษัท จีพี โปรแมค จำกัด</strong><br />115/58 หมู่ 10 ตำบลหนองขาม อำเภอศรีราชา จังหวัดชลบุรี 20230 ประเทศไทย',
      contact_back: "← กลับหน้าแรก",

      title_home: "GP Promach — งานกลึง CNC ความแม่นยำสูง",
      title_contact: "ติดต่อ — GP Promach"
    }
  };

  var current = "en";
  try {
    var saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "th") current = saved;
  } catch (e) {}

  function apply(lang) {
    current = lang;
    var table = dict[lang] || dict.en;
    document.documentElement.lang = lang;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (table[key] != null) nodes[i].innerHTML = table[key];
    }

    var titleKey = document.body.getAttribute("data-title");
    if (titleKey && table[titleKey]) document.title = table[titleKey];

    var buttons = document.querySelectorAll("[data-lang-toggle]");
    for (var j = 0; j < buttons.length; j++) {
      // Button shows the language you can switch TO.
      buttons[j].textContent = lang === "en" ? "ไทย" : "EN";
      buttons[j].setAttribute(
        "aria-label",
        lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"
      );
    }

    try { localStorage.setItem("lang", lang); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(current);
    var buttons = document.querySelectorAll("[data-lang-toggle]");
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].addEventListener("click", function () {
        apply(current === "en" ? "th" : "en");
      });
    }
  });
})();
