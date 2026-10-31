/* ==========================================================================
   TKAO.DEV — APP : navigation, langue, modales, formulaire, toast, replis
   Toutes les fonctionnalités d'origine sont conservées :
   i18n FR/EN · Web3Forms · CV · liens GitHub/LinkedIn/WhatsApp · images.
   ========================================================================== */

(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = Boolean(window.gsap);

  /* ─── 1. IMAGES MANQUANTES : repli papier élégant (jamais de cadre vide) ── */
  function placeholderSVG(label) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">` +
      `<rect width="800" height="500" fill="#EFE3CC"/>` +
      `<rect x="22" y="22" width="756" height="456" fill="none" stroke="#8F6840" stroke-width="3" stroke-dasharray="12 10" opacity="0.55"/>` +
      `<g transform="translate(400,215)" opacity="0.65">` +
      `<rect x="-46" y="-30" width="92" height="62" rx="8" fill="none" stroke="#57524B" stroke-width="5"/>` +
      `<circle cx="0" cy="1" r="17" fill="none" stroke="#57524B" stroke-width="5"/>` +
      `<rect x="20" y="-38" width="22" height="10" rx="3" fill="#57524B"/></g>` +
      `<text x="400" y="312" font-family="monospace" font-size="26" font-weight="700" fill="#57524B" text-anchor="middle">${label}</text>` +
      `<text x="400" y="346" font-family="monospace" font-size="17" fill="#8A847B" text-anchor="middle" letter-spacing="4">TKAO.DEV</text>` +
      `</svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function attachImageFallbacks() {
    $$("img[data-fallback]").forEach((img) => {
      const swap = () => {
        if (img.dataset.fallbackDone) return;
        img.dataset.fallbackDone = "1";
        img.classList.add("img-fallback");
        img.src = placeholderSVG(img.getAttribute("data-fallback"));
      };
      img.addEventListener("error", swap);
      if (img.complete && img.naturalWidth === 0) swap();
    });
  }

  /* ─── 2. NAVIGATION : ancres fluides + tiroir + espion de scroll ────────── */
  const lenis = window.__lenis || null;

  function scrollToTarget(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    if (lenis && !reduced) {
      lenis.scrollTo(target, {
        offset: hash === "#hero" ? 0 : -70,
        duration: 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 4) // sortie très douce, dépôt du « document »
      });
    } else {
      const top = hash === "#hero" ? 0 : target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    }
  }

  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const hash = a.getAttribute("href");
        if (hash.length < 2) return;
        e.preventDefault();
        closeDrawer();
        scrollToTarget(hash);
        history.replaceState(null, "", hash);
      });
    });
  }

  const drawer = $("#mobileDrawer");
  const burger = $("#hamburgerBtn");

  function openDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    burger.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (!drawer || !burger) return;
    if (!drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
    document.body.style.overflow = "";
  }

  function initDrawer() {
    if (!burger || !drawer) return;
    burger.addEventListener("click", () => {
      drawer.classList.contains("open") ? closeDrawer() : openDrawer();
    });
    $$("[data-drawer-close]", drawer).forEach((el) => el.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  }

  function initScrollSpy() {
    const sections = $$("section[id]");
    const tabs = $$(".nav-tab, .thumb-btn");
    if (!sections.length) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const pos = window.scrollY + 150;
      let currentId = sections[0].id;
      sections.forEach((sec) => {
        if (pos >= sec.offsetTop) currentId = sec.id;
      });

      // Le ruban de progression
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const fill = $("#scrollTapeFill");
      if (fill && docH > 0) fill.style.width = `${Math.min(100, (window.scrollY / docH) * 100)}%`;

      tabs.forEach((tab) => {
        tab.classList.toggle("active", tab.getAttribute("href") === `#${currentId}`);
      });
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ─── 3. MODALE PROJET : on « prend le document » et on le rapproche ────── */
  const modal = $("#projectModal");
  const modalSheet = modal ? $(".modal-sheet", modal) : null;
  let lastTrigger = null;

  function fillModalFrom(obj) {
    if (!modal) return;
    const num = $(".obj-num", obj);
    /* L'affiche et la lettre n'ont pas d'`.obj-title` : on retombe sur
       leurs titres stylisés pour remplir la modale. */
    const title = $(".obj-title", obj) || $(".poster-title", obj) || $(".letter-head", obj);
    const desc = $(".obj-desc", obj);
    const tech = $(".tech-stickers", obj);
    const img = $("img", obj);
    const link = $(".link-tag", obj);

    const titleText = title ? title.textContent.trim() : "";
    $("#modalNum", modal).textContent = num ? num.textContent.trim() : "";
    $("#modalTitle", modal).textContent = titleText;
    $("#modalDesc", modal).textContent = desc ? desc.textContent.trim() : "";

    const figure = $("#modalFigure", modal);
    const modalImg = $("#modalImg", modal);
    if (img && !img.classList.contains("img-fallback")) {
      modalImg.src = img.currentSrc || img.src;
      modalImg.alt = titleText;
      figure.hidden = false;
    } else if (img) {
      modalImg.src = img.src; // placeholder papier déjà en place
      modalImg.alt = titleText;
      figure.hidden = false;
    } else {
      figure.hidden = true;
    }

    const techBox = $("#modalTech", modal);
    techBox.innerHTML = "";
    if (tech) $$("li", tech).forEach((li) => {
      const clone = document.createElement("li");
      clone.textContent = li.textContent.trim();
      techBox.appendChild(clone);
    });

    if (link) {
      $("#modalLink", modal).href = link.href;
      $("#modalLink", modal).classList.remove("hidden");
    } else {
      $("#modalLink", modal).classList.add("hidden");
    }
  }

  function openModal(trigger) {
    if (!modal || !trigger) return;
    lastTrigger = trigger;
    fillModalFrom(trigger);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("open"));
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";

    const closeBtn = $(".modal-close", modal);
    if (closeBtn) closeBtn.focus({ preventScroll: true });

    // Le moteur d'animation ajoute sa micro-scène (stickers, titre, photo)
    document.dispatchEvent(new CustomEvent("tkao:modal-open"));

    // Transition « on rapproche la feuille »
    if (hasGsap && modalSheet && !reduced) {
      modalSheet.style.transition = "none";
      gsap.fromTo(modalSheet,
        { scale: 0.72, y: 70, rotation: 2.4, opacity: 0, transformOrigin: "50% 40%" },
        { scale: 1, y: 0, rotation: 0, opacity: 1, duration: 0.42, ease: "power3.out",
          onComplete: () => { modalSheet.style.transition = ""; } });
    }
  }

  function closeModal() {
    if (!modal || !modal.classList.contains("open")) return;
    const finish = () => {
      modal.classList.remove("open");
      modal.hidden = true;
      if (lenis) lenis.start();
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    };
    if (hasGsap && modalSheet && !reduced) {
      gsap.to(modalSheet, {
        scale: 0.9, y: 40, opacity: 0, duration: 0.24, ease: "power2.in",
        onComplete: finish
      });
    } else {
      finish();
    }
  }

  function initModals() {
    $$("[data-project]").forEach((obj) => {
      obj.addEventListener("click", (e) => {
        if (e.target.closest("[data-stop]")) return; // le lien GitHub reste un lien
        openModal(obj);
      });
      obj.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target.closest("a")) return;
          e.preventDefault();
          openModal(obj);
        }
      });
    });

    if (!modal) return;
    $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeModal(); closeLightbox(); }
      // Piège à focus minimaliste
      if (e.key === "Tab" && modal.classList.contains("open")) {
        const focusables = $$("a[href], button:not([disabled])", modal).filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ─── 4. VISIONNEUSE PHOTO (OPEN) ───────────────────────────────────────── */
  const lightbox = $("#lightbox");
  let lightboxTrigger = null;

  function openLightbox(trigger) {
    if (!lightbox) return;
    lightboxTrigger = trigger;
    const img = $("#lightboxImg", lightbox);
    const src = trigger.querySelector("img");
    if (src && img) { img.src = src.currentSrc || src.src; }
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add("open"));
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
    const closeBtn = $(".modal-close", lightbox);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains("open")) return;
    lightbox.classList.remove("open");
    lightbox.hidden = true;
    if (lenis) lenis.start();
    document.body.style.overflow = "";
    if (lightboxTrigger) lightboxTrigger.focus({ preventScroll: true });
  }

  function initLightbox() {
    const photo = $("#heroPhoto");
    if (photo) {
      photo.addEventListener("click", () => openLightbox(photo));
      photo.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(photo); }
      });
    }
    if (!lightbox) return;
    $$("[data-close]", lightbox).forEach((el) => el.addEventListener("click", closeLightbox));
  }

  /* ─── 5. FORMULAIRE WEB3FORMS + TAMPON « EXPÉDIÉ » ──────────────────────── */
  const toast = $("#toast");
  let toastTimer = null;

  function showToast(msg, ms = 4200) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), ms);
  }

  function initForm() {
    const form = $("#contactForm");
    const btn = $("#submitBtn");
    const stamp = $("#stampSent");
    if (!form || !btn) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const label = $("span[data-i18n='btnSubmit']", btn) || btn;
      const defaultText = label.textContent;

      label.textContent = translations[currentLang].btnSending;
      btn.disabled = true;

      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: new FormData(form)
        });
        const result = await res.json();

        if (result.success) {
          if (stamp) {
            stamp.classList.remove("stamped");
            void stamp.offsetWidth; // reflow pour rejouer l'animation
            stamp.classList.add("stamped");
            setTimeout(() => stamp.classList.remove("stamped"), 2400);
          }
          showToast(translations[currentLang].toastSuccess);
          form.reset();
        } else {
          showToast(translations[currentLang].toastError);
        }
      } catch (err) {
        showToast(translations[currentLang].toastNetwork);
      } finally {
        label.textContent = defaultText;
        btn.disabled = false;
      }
    });
  }

  /* ─── 6. LANGUE ─────────────────────────────────────────────────────────── */
  function initLang() {
    const btn = $("#langToggle");
    if (btn) {
      btn.addEventListener("click", () => {
        setLanguage(currentLang === "fr" ? "en" : "fr");
      });
    }
    setLanguage(currentLang);
  }

  /* ─── 7. LANCEMENT ──────────────────────────────────────────────────────── */
  function boot() {
    attachImageFallbacks();
    initLang();
    initAnchors();
    initDrawer();
    initScrollSpy();
    initModals();
    initLightbox();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
