// runtime for chrome primitives: theme toggle, mobile drawer, fab toc,
// active-section tracking. attaches to data-* hooks in the templates

(function () {
  if (typeof document === "undefined") return;

  // applied synchronously to avoid FOUC; both attrs set so paper-and-ink
  // CSS (data-theme) and Quartz CSS (saved-theme) match the same value
  const THEME_KEY = "theme";

  // teardown registry for per-nav init: SPA nav re-runs init() and we must
  // dispose stale observers/listeners before binding new ones
  const disposers = [];
  function dispose() {
    for (const d of disposers) {
      try { d(); } catch (_) {}
    }
    disposers.length = 0;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("saved-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }

  function currentTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved;
    } catch (_) {}
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }

  applyTheme(currentTheme());

  function initThemeClicks() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme-toggle]");
      if (!btn) return;
      e.preventDefault();
      const next = (document.documentElement.getAttribute("data-theme") || "light") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  // mobile drawer
  function initDrawer() {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-drawer-trigger]");
      if (trigger) {
        e.preventDefault();
        openDrawer();
        return;
      }
      const closer = e.target.closest("[data-drawer-close]");
      if (closer) {
        e.preventDefault();
        closeDrawer();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  function openDrawer() {
    const drawer = document.querySelector("[data-cartularium-drawer]");
    if (!drawer) return;
    drawer.hidden = false;
    drawer.dataset.state = "open";
    document.documentElement.classList.add("cartularium-scroll-locked");
    const trigger = document.querySelector("[data-drawer-trigger]");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    const drawer = document.querySelector("[data-cartularium-drawer]");
    if (!drawer || drawer.hidden) return;
    drawer.dataset.state = "closed";
    setTimeout(() => { drawer.hidden = true; }, 240);
    document.documentElement.classList.remove("cartularium-scroll-locked");
    const trigger = document.querySelector("[data-drawer-trigger]");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  // mobile fab toc
  function initFab() {
    const fab = document.querySelector("[data-toc-fab]");
    if (!fab) return;

    const trigger = fab.querySelector("[data-fab-trigger]");
    const sheet = fab.querySelector(".fab-sheet");
    const scrim = fab.querySelector(".fab-sheet-scrim");

    if (!trigger || !sheet) return;

    trigger.addEventListener("click", () => {
      const open = !sheet.hidden ? false : true;
      sheet.hidden = !open;
      if (scrim) scrim.hidden = !open;
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) document.documentElement.classList.add("cartularium-scroll-locked");
      else document.documentElement.classList.remove("cartularium-scroll-locked");
    });
    if (scrim) scrim.addEventListener("click", () => trigger.click());
    sheet.addEventListener("click", (e) => {
      if (e.target.closest("a")) trigger.click();
    });

    // hide fab until the article title scrolls out of view
    const title = document.querySelector("article h1, .article-title h1, h1");
    if (title && "IntersectionObserver" in window) {
      fab.style.display = "none";
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            fab.style.display = entry.isIntersecting ? "none" : "";
          }
        },
        { threshold: 0 },
      );
      io.observe(title);
      disposers.push(() => io.disconnect());
    }
  }

  // toc active-section tracking
  function initTocTracking() {
    if (!("IntersectionObserver" in window)) return;

    const links = document.querySelectorAll("[data-toc-link]");
    if (!links.length) return;

    const linkById = new Map();
    for (const link of links) {
      const id = link.getAttribute("data-toc-link");
      if (!linkById.has(id)) linkById.set(id, []);
      linkById.get(id).push(link);
    }

    const ids = Array.from(linkById.keys());
    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length) return;

    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // pick the first id (in document order) currently visible
        const activeId = ids.find((id) => visible.has(id)) || null;
        for (const [id, group] of linkById) {
          for (const a of group) a.classList.toggle("active", id === activeId);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    for (const t of targets) io.observe(t);
    disposers.push(() => io.disconnect());
  }

  // gutter label positions: minimap. labels sit at fractional positions
  // along the viewport-height gutter, mapped from each heading's y-offset
  // within <article>. progress indicator (initGutterProgress) shows where
  // the viewport is along the same axis. recomputed on load + resize so
  // sizing stays accurate after fonts/images settle.
  function initGutterPositions() {
    const gutter = document.querySelector("[data-toc-gutter]");
    if (!gutter) return;
    const labels = gutter.querySelectorAll(".gutter-label[data-toc-link]");
    const article = document.querySelector("article");
    if (!article || !labels.length) return;

    const articleRect = article.getBoundingClientRect();
    const articleTop = articleRect.top + window.scrollY;
    const articleHeight = articleRect.height;
    if (articleHeight <= 0) return;

    const gutterHeight = gutter.getBoundingClientRect().height;
    if (gutterHeight <= 0) return;

    // pass 1: read all heading positions before any writes
    const positions = [];
    for (const label of labels) {
      const id = label.getAttribute("data-toc-link");
      if (!id) continue;
      const target = document.getElementById(id);
      if (!target) continue;
      const headingTop = target.getBoundingClientRect().top + window.scrollY;
      const fraction = (headingTop - articleTop) / articleHeight;
      positions.push({ label, top: fraction * gutterHeight });
    }

    // pass 2: apply writes in a batch
    for (const { label, top } of positions) {
      label.style.top = `${top}px`;
    }
  }

  // gutter scroll-progress indicator (blog/guide). rAF-coalesced and
  // change-guarded so a busy scroll doesn't write style props on every tick
  // when the rounded percentages have not moved
  function initGutterProgress() {
    const gutter = document.querySelector("[data-toc-gutter]");
    const progress = gutter && gutter.querySelector("[data-toc-progress]");
    if (!gutter || !progress) return;

    let rafId = 0;
    let lastTop = -1;
    let lastHeight = -1;

    function compute() {
      rafId = 0;
      const article = document.querySelector("article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height;
      if (total <= 0) return;
      const scrolled = Math.max(0, -rect.top);
      const visibleHeight = Math.min(window.innerHeight, total - scrolled);
      const startPct = Math.round((scrolled / total) * 1000) / 10;
      const heightPct = Math.round((visibleHeight / total) * 1000) / 10;
      if (startPct === lastTop && heightPct === lastHeight) return;
      lastTop = startPct;
      lastHeight = heightPct;
      progress.style.top = `${startPct}%`;
      progress.style.height = `${heightPct}%`;
    }

    function schedule() {
      if (rafId) return;
      rafId = requestAnimationFrame(compute);
    }

    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    disposers.push(() => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafId) cancelAnimationFrame(rafId);
    });
  }

  // SPA re-runs init() per nav; document-delegated handlers are bound in
  // initOnce() to avoid listener accumulation (parity bug)
  function init() {
    dispose();
    initFab();
    initTocTracking();
    initGutterProgress();
    initGutterPositions();
  }
  function initOnce() {
    initThemeClicks();
    initDrawer();
  }

  // rAF debounce so a resize drag doesn't trigger N-heading reflow per pixel
  let gutterRaf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(gutterRaf);
    gutterRaf = requestAnimationFrame(() => initGutterPositions());
  });
  window.addEventListener("load", () => {
    initGutterPositions();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { initOnce(); init(); });
  } else {
    initOnce();
    init();
  }

  // quartz SPA nav: re-run per-nav init so scrollspy, fab, and gutter rebind
  // to fresh DOM. document-delegated handlers (theme, drawer) are not rerun.
  document.addEventListener("nav", () => {
    init();
  });
})();
