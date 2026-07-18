// Activates the submit box when the page was built with a service URL.
(function () {
  document.querySelectorAll(".submit-stub.live").forEach(function (box) {
    var service = box.dataset.service;
    var problem = box.dataset.problem;
    var input = box.querySelector("input");
    var button = box.querySelector("button");
    var out = box.querySelector(".verdict");

    function show(html) {
      out.innerHTML = html;
    }

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    function renderDone(data) {
      var v = data.verdict;
      var head =
        v === "accepted"
          ? '<strong class="ok">Accepted</strong> — all cases pass.'
          : "<strong>" + esc(v) + "</strong>";
      var lines = [];
      var detail = data.detail || {};
      (detail.lintErrors || []).forEach(function (e) {
        lines.push("<li>" + esc(e) + "</li>");
      });
      (detail.cases || []).forEach(function (c, i) {
        var label = c.kind === "sample" ? "sample" : "hidden " + i;
        lines.push("<li>case " + (i + 1) + " (" + label + "): " + (c.pass ? "pass" : esc(c.category)) + "</li>");
        (c.mismatches || []).slice(0, 5).forEach(function (m) {
          lines.push(
            "<li class=\"mm\">" +
              esc(m.note) +
              (m.row !== undefined
                ? " @ row " + (m.row + 1) + ": expected " + esc(JSON.stringify(m.expected)) + ", got " + esc(JSON.stringify(m.actual))
                : "") +
              "</li>",
          );
        });
      });
      if (detail.message) lines.push("<li>" + esc(detail.message) + "</li>");
      show(head + (lines.length ? "<ul>" + lines.join("") + "</ul>" : ""));
    }

    function poll(id, tries) {
      if (tries > 40) return show("Timed out waiting for the verdict — try refreshing in a minute.");
      fetch(service + "/api/submission/" + id)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status === "done") {
            button.disabled = false;
            renderDone(data);
          } else {
            setTimeout(function () { poll(id, tries + 1); }, 2500);
          }
        })
        .catch(function () { setTimeout(function () { poll(id, tries + 1); }, 4000); });
    }

    button.addEventListener("click", function () {
      var url = input.value.trim();
      if (!url) return show("Paste your sheet's share link first (Share → anyone with the link, Viewer).");
      button.disabled = true;
      show("Judging… this takes ten seconds or so.");
      fetch(service + "/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ problemId: problem, sheetUrl: url }),
      })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
        .then(function (r) {
          if (!r.ok) {
            button.disabled = false;
            return show(esc(r.body.error || "Submission failed."));
          }
          poll(r.body.submissionId, 0);
        })
        .catch(function () {
          button.disabled = false;
          show("Could not reach the judging service.");
        });
    });
  });
})();
