/* ==========================================================================
   TKAO.DEV — CURSEUR CUSTOM
   Discret : un point vermillon + une étiquette contextuelle (VIEW / OPEN / GO / MOVE).
   Desktop uniquement (pointer fin) — jamais sur tactile. Accessible : le
   curseur natif reste visible, ce module ne fait que l'accompagner.
   ========================================================================== */

(function () {
  "use strict";

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function init() {
    const cursor = document.getElementById("cursor");
    const chip = document.getElementById("cursorChip");
    if (!cursor || !chip) return;

    // Le point suit instantanément, l'étiquette suit avec une petite inertie.
    cursor.classList.add("is-on");

    let chipX = 0, chipY = 0, targetX = 0, targetY = 0;
    let rafId = null;

    const dot = cursor.querySelector(".cursor-dot");

    function placeDot(x, y) {
      if (dot) dot.style.transform = `translate(${x}px, ${y}px)`;
      cursor.classList.add("is-visible");
    }

    function tick() {
      // Inertie douce pour l'étiquette (jamais un cercle flashy : un chip discret)
      chipX += (targetX - chipX) * 0.22;
      chipY += (targetY - chipY) * 0.22;
      chip.style.transform = `translate(${chipX}px, ${chipY}px)`;
      rafId = requestAnimationFrame(tick);
    }

    document.addEventListener("mousemove", (e) => {
      placeDot(e.clientX, e.clientY);
      targetX = e.clientX;
      targetY = e.clientY;
      if (rafId === null && !reduce.matches) rafId = requestAnimationFrame(tick);
    }, { passive: true });

    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
    document.addEventListener("mouseenter", () => cursor.classList.add("is-visible"));

    // Étiquettes contextuelles : VIEW (projets) · OPEN (photos) · GO (liens) · MOVE (objets)
    const LABELS = {
      view: "VIEW",
      open: "OPEN",
      go: "GO",
      move: "MOVE"
    };

    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest("[data-cursor]");
      if (!target) { cursor.classList.remove("has-label"); return; }
      const kind = target.getAttribute("data-cursor");
      const label = LABELS[kind];
      if (!label) { cursor.classList.remove("has-label"); return; }
      chip.textContent = label;
      cursor.classList.add("has-label");
    }, { passive: true });

    // Pression : le point s'encre quand on clique (micro-feedback papier)
    document.addEventListener("pointerdown", () => cursor.classList.add("is-down"), { passive: true });
    document.addEventListener("pointerup", () => cursor.classList.remove("is-down"), { passive: true });
    document.addEventListener("pointercancel", () => cursor.classList.remove("is-down"), { passive: true });

    // Changement de périphérique à chaud (ex : écran tactile branché)
    fine.addEventListener?.("change", () => {
      if (!fine.matches) cursor.classList.remove("is-on", "is-visible", "has-label", "is-down");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
