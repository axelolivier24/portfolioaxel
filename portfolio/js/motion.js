/* ==========================================================================
   TKAO.DEV — MOTION DESIGN v3 « La table vivante »
   Chorégraphie complète : la table se construit (hero), les documents
   tombent avec gravité, les tampons s'encrent, les stickers se décollent,
   les papiers glissent quand on scrolle (skew vélocité), les boutons sont
   aimantés, les bandes de scotch défilent. GSAP + ScrollTrigger + Lenis,
   repli statique élégant si une librairie manque ou mouvement réduit.
   ========================================================================== */

(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Filet de sécurité : pas de GSAP / mouvement réduit → page statique ── */
  if (!window.gsap || !window.ScrollTrigger || reduce || !window.Lenis) {
    document.documentElement.classList.remove("anim");
    document.documentElement.classList.add("motion-off");
    window.__motionReady = true;
    return;
  }

  window.__motionReady = true;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ── 1. LENIS : défilement fluide, calibré ───────────────────────────────
     Inertie courte et posée : un cran de molette avance un peu moins loin
     (wheelMultiplier 0.9) et la page rattrape vite (lerp 0.11) — sensation
     « feuilles qu'on fait glisser », jamais de flottaison ni de course. */
  const lenis = new Lenis({
    lerp: 0.11,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.15,
    smoothWheel: true,
    syncTouch: false
  });
  window.__lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const q = gsap.utils.selector(document);
  const rand = gsap.utils.random;

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function finalRotation(el) {
    return parseFloat(gsap.getProperty(el, "rotation")) || 0;
  }

  /* Découpe un texte en mots > lettres (spans .w > .l) sans toucher aux
     éléments enfants (ex. .dev-chip reste un bloc unique). Les mots sont
     insécables (white-space:nowrap) pour éviter les coupures mi-mot.
     Ré-entrant : si i18n a réécrit le textContent (spans détruits), on redécoupe. */
  function splitLetters(el) {
    if (!el) return [];
    const existing = el.querySelector(".l");
    if (existing) return Array.from(el.querySelectorAll(".l"));
    const nodes = Array.from(el.childNodes);
    const frag = document.createDocumentFragment();
    const letters = [];
    nodes.forEach((node) => {
      if (node.nodeType === 3) {
        // mots séparés par espaces (insécables inclus) : chaque mot est un bloc .w
        const chunks = node.textContent.split(/(\s+)/);
        chunks.forEach((chunk) => {
          if (chunk === "") return;
          if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(" ")); return; }
          const word = document.createElement("span");
          word.className = "w";
          Array.from(chunk).forEach((ch) => {
            const s = document.createElement("span");
            s.className = "l";
            s.textContent = ch;
            word.appendChild(s);
            letters.push(s);
          });
          frag.appendChild(word);
        });
      } else {
        frag.appendChild(node); // .dev-chip etc. reste entier
      }
    });
    el.innerHTML = "";
    el.appendChild(frag);
    return letters;
  }

  function splitAllTitles() {
    q(".sec-title-text").forEach((el) => splitLetters(el));
  }

  /* ── 2. HERO : LA TABLE SE CONSTRUIT ──────────────────────────────────── */
  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    const sheet = q('[data-anim="sheet"]')[0];
    const photo = q(".polaroid")[0];
    const wordmark = q('[data-anim="wordmark"]')[0];

    // La feuille d'identité tombe, se tasse légèrement en touchant la table
    if (sheet) {
      const r = finalRotation(sheet);
      const t0 = 0.05;
      tl.fromTo(sheet,
        { y: isMobile ? -110 : -170, rotation: r - (isMobile ? 4 : 7), opacity: 0 },
        { y: 0, rotation: r, opacity: 1, duration: isMobile ? 0.62 : 0.8, ease: "power2.in" }, t0);
      tl.to(sheet, { scaleY: 0.982, scaleX: 1.008, duration: 0.1, ease: "power1.out" }, isMobile ? 0.66 : 0.84);
      tl.to(sheet, { scaleY: 1, scaleX: 1, duration: 0.3, ease: "power2.out" }, isMobile ? 0.76 : 0.94);
    }

    // Le tirage photo arrive derrière, suspendu à son trombone (balancement)
    const desk = q('[data-anim="desk"]')[0];
    if (desk) tl.set(desk, { opacity: 1 }, isMobile ? 0.26 : 0.4);
    if (photo) {
      const r = finalRotation(photo);
      tl.fromTo(photo,
        { y: isMobile ? -90 : -150, rotation: r + 10, opacity: 0 },
        { y: 0, rotation: r, opacity: 1, duration: 0.8, ease: "power2.inOut" },
        isMobile ? 0.32 : 0.46);
      // la photo « se développe » comme un polaroïd
      const img = photo.querySelector("img");
      if (img) tl.fromTo(img,
        { filter: "sepia(0.55) saturate(0.45) brightness(1.12) contrast(0.9)" },
        { filter: "sepia(0.07) saturate(0.97) brightness(1) contrast(1)", duration: 1.5, ease: "power1.inOut" },
        isMobile ? 0.75 : 1.0);
    }

    // Les bandes de scotch « claquent » sur les feuilles
    tl.fromTo(q(".identity-sheet .tape, .polaroid .tape"),
      { scale: 0, opacity: 0, rotation: () => rand(-24, 24) },
      { scale: 1, opacity: 0.94, rotation: 0, duration: 0.38, ease: "back.out(2.2)", transformOrigin: "50% 50%", stagger: 0.07 },
      isMobile ? 0.72 : 1.0);

    // Les petits objets du bureau se posent
    const stickyEl = q('[data-anim="sticky"]')[0];
    if (stickyEl) {
      const sr = finalRotation(stickyEl);
      tl.fromTo(stickyEl,
        { y: -56, opacity: 0, rotation: sr + 9 },
        { y: 0, opacity: 1, rotation: sr, duration: 0.5, ease: "power2.in" },
        isMobile ? 0.55 : 0.78);
      tl.to(stickyEl, { rotation: sr - 1.6, duration: 0.16, ease: "power1.inOut" }, isMobile ? 1.05 : 1.28);
      tl.to(stickyEl, { rotation: sr + 0.9, duration: 0.14, ease: "power1.inOut" }, isMobile ? 1.21 : 1.44);
      tl.to(stickyEl, { rotation: sr, duration: 0.2, ease: "power1.inOut" }, isMobile ? 1.35 : 1.58);
    }
    const ticketEl = q('[data-anim="ticket"]')[0];
    if (ticketEl) {
      const tr = finalRotation(ticketEl);
      tl.fromTo(ticketEl,
        { x: -44, opacity: 0, rotation: tr - 9 },
        { x: 0, opacity: 1, rotation: tr, duration: 0.5, ease: "power2.inOut" },
        isMobile ? 1.02 : 1.26);
    }
    tl.fromTo(q(".desk-clip"), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4 }, isMobile ? 1.12 : 1.4);
    tl.fromTo(q(".hero-bg [data-plx]"), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.08 }, isMobile ? 1.0 : 1.3);

    // Le nom : les lettres montent une à une derrière le liseré
    if (wordmark) tl.set(wordmark, { opacity: 1 }, isMobile ? 0.44 : 0.6);
    let wmLetters = [];
    const maskInner = q('[data-anim="wordmark"] .mask-inner')[0];
    if (maskInner) wmLetters = splitLetters(maskInner);
    if (wmLetters.length) {
      tl.from(wmLetters,
        { yPercent: 118, rotation: () => rand(-8, 8), duration: 0.72, ease: "back.out(1.6)", stagger: 0.055 },
        isMobile ? 0.48 : 0.64);
    }
    tl.from(q(".dev-chip"),
      { scale: 0.3, rotation: -16, opacity: 0, duration: 0.45, ease: "back.out(1.9)", transformOrigin: "30% 60%" },
      isMobile ? 0.9 : 1.12);

    const nameEl = q('[data-anim="name"]')[0];
    if (nameEl) {
      const nr = finalRotation(nameEl);
      tl.fromTo(nameEl,
        { y: 18, opacity: 0, rotation: nr + 2 },
        { y: 0, opacity: 1, rotation: nr, duration: 0.5, ease: "power3.out" },
        isMobile ? 0.96 : 1.2);
    }

    // Le tampon métier s'encre d'un coup sec + petites confettis de papier
    const stampEl = q('[data-anim="stamp"]')[0];
    if (stampEl) {
      const stR = finalRotation(stampEl);
      tl.fromTo(stampEl,
        { scale: 2.1, opacity: 0, rotation: stR - 14 },
        { scale: 1, opacity: 1, rotation: stR, duration: 0.3, ease: "expo.in" },
        isMobile ? 1.06 : 1.32);
      tl.add(() => paperBurst(stampEl), isMobile ? 1.34 : 1.6);
    }

    q('[data-anim="hand"]').forEach((el) => {
      const hr = finalRotation(el);
      tl.fromTo(el,
        { x: -18, opacity: 0, rotation: hr - 2.5 },
        { x: 0, opacity: 1, rotation: hr, duration: 0.5, ease: "power3.out" },
        isMobile ? 1.18 : 1.44);
    });

    q('[data-anim="fade"]').forEach((el, i) => {
      const fr = finalRotation(el);
      tl.fromTo(el,
        { y: 14, opacity: 0, rotation: fr + 1.4 },
        { y: 0, opacity: 1, rotation: fr, duration: 0.5, ease: "power3.out" },
        (isMobile ? 1.26 : 1.52) + i * 0.1);
    });

    const actionsWrap = q('[data-anim="actions"]')[0];
    if (actionsWrap) tl.set(actionsWrap, { opacity: 1 }, isMobile ? 1.3 : 1.58);
    tl.from(q('[data-anim="actions"] > *'),
      { y: 24, opacity: 0, rotation: 3, duration: 0.5, stagger: 0.1, clearProps: "transform" },
      isMobile ? 1.36 : 1.62);

    tl.fromTo(q(".scroll-hint"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, isMobile ? 1.38 : 1.74);

    // Une fois posés, on rend leurs transforms au CSS (hover vivants)
    tl.eventCallback("onComplete", () => {
      gsap.set(".polaroid, .sticky-note, .ticket-stub, .hero-actions .btn-ink, .hero-actions .btn-label", { clearProps: "transform" });
      if (window.__setupHintFade) window.__setupHintFade();
    });

    return tl;
  }

  /* Confettis de papier : éclats qui voltigent depuis un tampon */
  function paperBurst(anchor) {
    const sheet = q(".identity-sheet")[0];
    if (!sheet || !anchor) return;
    const sr = sheet.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    const colors = ["#C43D1B", "#E5B93F", "#2050C8", "#F6F0E2"];
    for (let i = 0; i < 7; i++) {
      const bit = document.createElement("span");
      bit.className = "confetti-bit";
      bit.style.background = colors[i % colors.length];
      bit.style.left = (ar.left - sr.left + ar.width / 2) + "px";
      bit.style.top = (ar.top - sr.top + ar.height / 2) + "px";
      sheet.appendChild(bit);
      gsap.fromTo(bit,
        { x: 0, y: 0, rotation: rand(-30, 30), opacity: 1, scale: rand(0.6, 1) },
        {
          x: rand(-90, 90), y: rand(46, 120), rotation: rand(-220, 220), opacity: 0,
          duration: rand(0.7, 1.15), ease: "power2.out",
          onComplete: () => bit.remove()
        });
    }
  }

  /* ── 3. REVEALS AU SCROLL : les documents se déposent avec gravité ────── */
  function setupReveals() {
    const dist = isMobile ? 30 : 56;

    const playReveal = (el) => {
      if (el.__revealed) return;
      el.__revealed = true;
      el.__revealing = true;
      const baseRot = finalRotation(el);
      const kind = el.getAttribute("data-reveal");

      const tl = gsap.timeline({
        onComplete: () => { gsap.set(el, { clearProps: "transform" }); el.__revealing = false; }
      });

      if (kind === "left") {
        tl.fromTo(el,
          { x: -dist, opacity: 0, rotation: baseRot - 2.6 },
          { x: 0, opacity: 1, rotation: baseRot, duration: isMobile ? 0.55 : 0.7, ease: "power3.out" }, 0);
      } else if (kind === "right") {
        tl.fromTo(el,
          { x: dist, opacity: 0, rotation: baseRot + 2.6 },
          { x: 0, opacity: 1, rotation: baseRot, duration: isMobile ? 0.55 : 0.7, ease: "power3.out" }, 0);
      } else {
        /* Chute de document : gravité (power2.in) puis tassement du papier */
        tl.fromTo(el,
          { y: -dist, opacity: 0, rotation: baseRot + rand(-2.4, 2.4) },
          { y: 0, opacity: 1, rotation: baseRot, duration: isMobile ? 0.5 : 0.6, ease: "power2.in" }, 0);
        const squashAt = isMobile ? 0.5 : 0.6;
        tl.to(el, { scaleY: 0.978, scaleX: 1.01, duration: 0.08, ease: "power1.out" }, squashAt);
        tl.to(el, { scaleY: 1, scaleX: 1, duration: 0.24, ease: "power2.out" }, squashAt + 0.08);
      }

      /* Les stickers se décollent et se posent en pluie */
      const stickerLis = el.querySelectorAll(".sticker-cloud > li");
      if (stickerLis.length) {
        tl.fromTo(stickerLis,
          { y: isMobile ? -16 : -26, opacity: 0, scale: 1.16 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power2.out", stagger: 0.06 }, 0.26);
      }
      /* Les trombones/tampons enfants se posent */
      const clips = el.querySelectorAll(".doc-clip, .pushpin, .staple");
      if (clips.length) {
        tl.fromTo(clips, { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)", stagger: 0.06, clearProps: "transform,opacity" }, 0.3);
      }
      /* Les badges papier s'écrivent un à un */
      const badges = el.querySelectorAll(".paper-badge");
      if (badges.length) {
        tl.fromTo(badges, { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.38, ease: "back.out(2.4)", stagger: 0.07, clearProps: "transform,opacity" }, 0.32);
      }
      /* Les étiquettes techniques des projets apparaissent en file */
      const tech = el.querySelectorAll(".tech-stickers li");
      if (tech.length) {
        tl.fromTo(tech, { y: 9, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.32, stagger: 0.045, ease: "power2.out", clearProps: "transform,opacity" }, 0.3);
      }
      /* Les languettes du dossier manila se déplient */
      if (el.classList.contains("folder")) {
        const tabs = el.querySelectorAll(".folder-tab");
        if (tabs.length) {
          tl.fromTo(tabs, { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.09, ease: "power2.out", clearProps: "transform,opacity" }, 0.2);
        }
      }
    };

    q("[data-reveal]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 94%",
        once: true,
        onEnter: () => playReveal(el)
      });
    });

    // Filet de sécurité : tout élément déjà dans le champ au chargement
    requestAnimationFrame(() => {
      q("[data-reveal]").forEach((el) => {
        if (!el.__revealed && el.getBoundingClientRect().top < window.innerHeight * 0.96) {
          playReveal(el);
        }
      });
    });
  }

  /* ── 4. CHORÉGRAPHIE DES EN-TÊTES : lettres, tampons, crayonnés ───────── */
  function setupHeaders() {
    q(".sec-head").forEach((head) => {
      const titleBox = head.querySelector(".sec-title-text");
      const tag = head.querySelector(".sec-tag");
      const stamp = head.querySelector(".sec-stamp");
      const scribble = head.querySelector(".scribble path");

      // état initial des lettres (masquées tant que la section n'est pas entrée)
      const letters = titleBox ? splitLetters(titleBox) : [];
      if (letters.length) gsap.set(letters, { y: isMobile ? 16 : 26, opacity: 0 });

      ScrollTrigger.create({
        trigger: head,
        start: "top 84%",
        once: true,
        onEnter: () => {
          head.__secIn = true;
          if (tag) gsap.fromTo(tag,
            { y: -10, opacity: 0, rotation: -6 },
            { y: 0, opacity: 1, rotation: -1.6, duration: 0.45, ease: "back.out(1.8)", clearProps: "transform,opacity" });
          /* On requête les spans AU MOMENT T : i18n peut avoir réécrit
             le titre (changement de langue) et détruit les anciens spans. */
          const live = titleBox ? splitLetters(titleBox) : [];
          if (live.length) {
            gsap.to(live, {
              y: 0, opacity: 1, rotation: 0, duration: 0.55, ease: "power3.out",
              stagger: 0.035, delay: 0.06,
              overwrite: true
            });
          }
          if (stamp) {
            const sr = finalRotation(stamp);
            gsap.fromTo(stamp,
              { scale: 2.2, opacity: 0, rotation: sr + 12 },
              { scale: 1, opacity: 0.95, rotation: sr, duration: 0.32, ease: "expo.in", delay: 0.42, clearProps: "transform" });
          }
          if (scribble && scribble.getTotalLength) {
            const len = scribble.getTotalLength();
            gsap.fromTo(scribble,
              { strokeDasharray: len, strokeDashoffset: len },
              { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", delay: 0.5 });
          }
        }
      });
    });

  }

  /* ── 5. PARALLAXE MULTI-COUCHES (bureau en profondeur) ─────────────────── */
  function setupParallax() {
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      q("[data-plx]").forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-plx")) || 0.5;
        gsap.to(el, {
          y: () => -speed * 74,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.6 }
        });
        // les chutes de papier tournent aussi très lentement
        if (el.classList.contains("scrap-tag") || el.classList.contains("scrap-pencil")) {
          gsap.to(el, {
            rotation: "+=7",
            ease: "none",
            scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1.4 }
          });
        }
      });
      gsap.to(".hero-grid", {
        y: () => 64,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.8 }
      });
    });

    mm.add("(min-width: 768px) and (max-width: 1023px)", () => {
      q("[data-plx]").forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-plx")) || 0.5;
        gsap.to(el, {
          y: () => -speed * 32,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.7 }
        });
      });
    });
    // Mobile : pas de parallaxe (lisibilité et performance d'abord)
  }

  /* ── 6. PARALLAXE SOURIS + TILT PHOTO + BOUTONS AIMANTÉS (desktop) ────── */
  function setupMouseParallax() {
    if (!finePointer || isMobile) return;

    const hero = q("#hero")[0];
    const layers = q("#hero [data-plx]");
    const tilt = q("#photoTilt")[0];
    if (hero) {
      const movers = layers.map((el) => {
        const speed = parseFloat(el.getAttribute("data-plx")) || 0.5;
        return {
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
          speed
        };
      });

      let tiltX = null, tiltY = null;
      if (tilt) {
        tiltX = gsap.quickTo(tilt, "rotationY", { duration: 0.8, ease: "power3.out" });
        tiltY = gsap.quickTo(tilt, "rotationX", { duration: 0.8, ease: "power3.out" });
      }

      hero.addEventListener("mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        movers.forEach((m) => { m.x(dx * 10 * m.speed); m.y(dy * 8 * m.speed); });
        if (tiltX && tiltY) { tiltX(dx * 5); tiltY(dy * -4); }
      }, { passive: true });

      hero.addEventListener("mouseleave", () => {
        movers.forEach((m) => { m.x(0); m.y(0); });
        if (tiltX && tiltY) { tiltX(0); tiltY(0); }
      });
    }

    /* Boutons aimantés : la main « attire » les pièces du bureau */
    q(".btn-ink, .btn-label, .lang-btn, .modal-close").forEach((btn) => {
      const mx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      const my = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.34);
      }, { passive: true });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)", clearProps: "transform" });
      });
    });
  }

  /* ── 7. SKEW VÉLOCITÉ : les papiers glissent quand on pousse la table ─── */
  function setupVelocitySkew() {
    if (isMobile) return;
    const els = q(".obj-inner, .doc");
    if (!els.length) return;

    const clampSkew = gsap.utils.clamp(-1.7, 1.7);
    const setters = els.map((el) => ({
      el,
      set: gsap.quickTo(el, "skewY", { duration: 0.55, ease: "power3.out" })
    }));
    let settleTimer = null;

    ScrollTrigger.create({
      onUpdate(self) {
        const v = clampSkew(self.getVelocity() / -420);
        setters.forEach((s) => { if (!s.el.__revealing) s.set(v); });
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          setters.forEach((s) => { if (!s.el.__revealing) gsap.set(s.el, { skewY: 0, clearProps: "transform" }); });
        }, 180);
      }
    });
  }

  /* ── 8. MICRO-SCÈNES : tampon postal, badge courrier, champs, footer ──── */
  function setupMicroScenes() {
    /* Le timbre se colle sur le carnet d'adresses */
    const stamp = q(".postage-stamp")[0];
    if (stamp) {
      gsap.set(stamp, { opacity: 0 });
      ScrollTrigger.create({
        trigger: ".address-card",
        start: "top 78%",
        once: true,
        onEnter: () => {
          gsap.fromTo(stamp,
            { y: -34, rotation: 12, scale: 1.5, opacity: 0 },
            { y: 0, rotation: 3.5, scale: 1, opacity: 1, duration: 0.42, ease: "expo.in", delay: 0.45 });
          gsap.fromTo(q(".address-row"),
            { x: -14, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, stagger: 0.07, delay: 0.25, ease: "power2.out", clearProps: "transform,opacity" });
        }
      });
    }

    /* Le badge « courrier rapide » tombe sur la feuille formulaire */
    const badge = q(".form-badge")[0];
    if (badge) {
      gsap.set(badge, { opacity: 0 });
      ScrollTrigger.create({
        trigger: ".form-sheet",
        start: "top 78%",
        once: true,
        onEnter: () => gsap.fromTo(badge,
          { scale: 2, opacity: 0, rotation: -10 },
          { scale: 1, opacity: 1, rotation: -2, duration: 0.3, ease: "expo.in", delay: 0.4, clearProps: "transform" })
      });
    }

    /* Les lignes du formulaire se soulignent à l'encre vermillon */
    q(".field").forEach((field, i) => {
      ScrollTrigger.create({
        trigger: field,
        start: "top 92%",
        once: true,
        onEnter: () => field.classList.add("in-view")
      });
    });

    /* Pied de page : la signature de l'atelier */
    ScrollTrigger.create({
      trigger: ".footer",
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.fromTo(q(".footer-wordmark"),
          { yPercent: 46, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
        gsap.fromTo(q(".footer-socials li"),
          { y: 16, opacity: 0, rotation: () => rand(-6, 6) },
          { y: 0, opacity: 1, rotation: 0, duration: 0.45, stagger: 0.08, delay: 0.25, ease: "back.out(1.8)", clearProps: "transform,opacity" });
        gsap.fromTo(q(".footer-thanks"),
          { x: -18, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.55, delay: 0.15, ease: "power2.out" });
      }
    });

    /* Le tampon « À suivre… » de la dernière feuille */
    const finalStamp = q(".final-stamp")[0];
    if (finalStamp) {
      gsap.set(finalStamp, { opacity: 0 });
      ScrollTrigger.create({
        trigger: ".final-sheet",
        start: "top 80%",
        once: true,
        onEnter: () => {
          const fr = finalRotation(finalStamp);
          gsap.fromTo(finalStamp,
            { scale: 2.3, opacity: 0, rotation: fr + 14 },
            { scale: 1, opacity: 0.95, rotation: fr, duration: 0.32, ease: "expo.in", delay: 0.5, clearProps: "transform" });
        }
      });
    }

    /* La flèche « faites défiler » s'efface dès qu'on quitte le hero.
       Créée APRÈS l'intro pour ne pas se battre avec elle sur opacity. */
    window.__setupHintFade = () => {
      gsap.fromTo(".scroll-hint", { opacity: 1, y: 0 }, {
        opacity: 0, y: -8, ease: "none", immediateRender: false,
        scrollTrigger: { trigger: "#about", start: "top 98%", end: "top 72%", scrub: true }
      });
    };

    /* Les notes manuscrites « en flux » s'écrivent à l'entrée */
    q(".skills-hand, .sec-hand").forEach((el) => {
      gsap.fromTo(el,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    });

    /* Modale projet : les stickers techniques sautent en place */
    document.addEventListener("tkao:modal-open", () => {
      const tech = q("#modalTech li");
      if (tech.length) {
        gsap.fromTo(tech,
          { y: 12, opacity: 0, scale: 0.6, rotation: () => rand(-10, 10) },
          { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 0.42, ease: "back.out(2.2)", stagger: 0.055, delay: 0.14, clearProps: "transform,opacity" });
      }
      const img = q("#modalImg")[0];
      if (img) gsap.fromTo(img, { scale: 1.14, opacity: 0.35 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" });
      const title = q("#modalTitle")[0];
      const desc = q("#modalDesc")[0];
      if (title) gsap.fromTo(title, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.08, ease: "power3.out" });
      if (desc) gsap.fromTo(desc, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.16, ease: "power3.out" });
    });

    /* Changement de langue : on redécoupe les titres en lettres.
       Les en-têtes déjà révélés restent visibles ; les autres se
       re-masquent en attendant leur entrée. */
    document.addEventListener("tkao:lang", () => {
      q(".sec-head").forEach((head) => {
        const titleBox = head.querySelector(".sec-title-text");
        if (!titleBox) return;
        const letters = splitLetters(titleBox);
        if (letters.length && !head.__secIn) gsap.set(letters, { y: isMobile ? 16 : 26, opacity: 0 });
      });
      ScrollTrigger.refresh();
    });
  }

  /* ── 9. LANCEMENT ──────────────────────────────────────────────────────── */
  function boot() {
    splitAllTitles();
    heroIntro();
    setupReveals();
    setupHeaders();
    setupParallax();
    setupMouseParallax();
    setupVelocitySkew();
    setupMicroScenes();

    // Quand les images (CAP*.webp) et les polices arrivent, la géométrie change → recalcul
    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }

    let lastW = window.innerWidth;
    let rT = null;
    window.addEventListener("resize", () => {
      if (Math.abs(window.innerWidth - lastW) > 120) {
        lastW = window.innerWidth;
        clearTimeout(rT);
        rT = setTimeout(() => ScrollTrigger.refresh(), 220);
      }
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
