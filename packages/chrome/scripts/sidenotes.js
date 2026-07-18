// @cartularium/chrome — sidenote bidirectional hover linking.
// pairs anchors and sidenotes that share data-fn="<id>"; mouseenter on either
// adds .fn-active to all matching elements; mouseleave clears.
//
// loaded as a separate file so consumers without sidenotes (function pages,
// concept pages, assay) don't pull in the handler.

(function () {
  if (typeof document === "undefined") return;

  const disposers = [];
  function dispose() {
    for (const d of disposers) {
      try { d(); } catch (_) {}
    }
    disposers.length = 0;
  }

  function init() {
    dispose();
    // group elements by their data-fn id so hover events flip the pair
    // without a full-document query per event
    const byId = new Map();
    for (const el of document.querySelectorAll("[data-fn]")) {
      const id = el.dataset.fn;
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(el);
    }
    for (const [id, group] of byId) {
      const setActive = (active) => {
        for (const el of group) el.classList.toggle("fn-active", active);
      };
      const onIn = () => setActive(true);
      const onOut = () => setActive(false);
      for (const el of group) {
        el.addEventListener("mouseenter", onIn);
        el.addEventListener("mouseleave", onOut);
        el.addEventListener("focus", onIn);
        el.addEventListener("blur", onOut);
      }
      disposers.push(() => {
        for (const el of group) {
          el.removeEventListener("mouseenter", onIn);
          el.removeEventListener("mouseleave", onOut);
          el.removeEventListener("focus", onIn);
          el.removeEventListener("blur", onOut);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // quartz SPA nav: re-bind to fresh DOM after the article swaps in
  document.addEventListener("nav", init);
})();
