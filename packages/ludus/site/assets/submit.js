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

    function cellText(v) {
      if (v === null || v === undefined || v === "") return "(blank)";
      return String(v);
    }

    var CATEGORY = {
      "wrong-value": "wrong value",
      "wrong-shape": "wrong shape",
      "error-in-output": "error in output",
    };

    // one line of plain guidance per verdict; the head states what happened,
    // the sub states what to do about it
    var GUIDANCE = {
      "lint-reject":
        "Rejected before judging — nothing was graded. Fix the flagged cells and resubmit.",
      "sheet-inaccessible":
        "The judge could not open your sheet. Share it with “Anyone with the link” as Viewer, then resubmit.",
      "template-damaged":
        "The INPUT/OUTPUT named ranges are missing or moved. Restore them, or make a fresh copy of the template and rebuild there.",
      "judge-error":
        "That one is on us, not you — resubmit. If it keeps happening, it has already paged the maintainer.",
    };

    function caseChips(cases) {
      var chips = cases.map(function (c, i) {
        var hiddenIndex = cases.slice(0, i).filter(function (x) { return x.kind === "hidden"; }).length + 1;
        var label = c.kind === "sample" ? "sample" : "hidden " + hiddenIndex;
        return (
          '<span class="vchip ' + (c.pass ? "pass" : "fail") + '">' +
          (c.pass ? "✓ " : "✗ ") + esc(label) +
          (c.pass ? "" : " — " + esc(CATEGORY[c.category] || c.category)) +
          "</span>"
        );
      });
      return '<div class="case-chips">' + chips.join("") + "</div>";
    }

    function sampleDiff(cases) {
      var sample = cases.filter(function (c) { return c.kind === "sample" && !c.pass; })[0];
      if (!sample || !sample.mismatches || !sample.mismatches.length) return "";
      var mm = sample.mismatches;
      var valueRows = mm.filter(function (m) { return m.row !== undefined; });
      var notes = mm.filter(function (m) { return m.row === undefined; });
      var html = "";
      notes.forEach(function (m) {
        html += '<p class="vnote">' + esc(m.note) + "</p>";
      });
      if (valueRows.length) {
        html +=
          '<div class="grid-scroll vdiff"><table class="grid">' +
          "<tr><th>OUTPUT row</th><th>Expected</th><th>Got</th></tr>" +
          valueRows
            .map(function (m) {
              return (
                "<tr><td>" + (m.row + 1) + "</td><td>" + esc(cellText(m.expected)) +
                "</td><td>" + esc(cellText(m.actual)) + "</td></tr>"
              );
            })
            .join("") +
          "</table></div>";
        if (mm.length >= 10) html += '<p class="vnote">Showing the first ' + valueRows.length + " differences.</p>";
      }
      return html;
    }

    function renderDone(data) {
      var v = data.verdict;
      var detail = data.detail || {};
      var cases = detail.cases || [];
      var failed = cases.filter(function (c) { return !c.pass; });
      var html = "";

      if (v === "accepted") {
        html += '<p class="vhead"><strong class="ok">Accepted</strong> — all ' + cases.length + " cases pass.</p>";
      } else if (v === "wrong-answer") {
        html +=
          '<p class="vhead"><strong>Wrong Answer</strong> — ' +
          failed.length + " of " + cases.length + " cases fail.</p>";
        var samplePasses = cases.some(function (c) { return c.kind === "sample" && c.pass; });
        var hiddenFails = failed.some(function (c) { return c.kind === "hidden"; });
        if (samplePasses && hiddenFails) {
          html +=
            '<p class="vsub">Your sheet passes the sample but not the hidden datasets — ' +
            "it may be tuned to the sample data or missing a general rule. " +
            "Try editing INPUT in your copy to invent your own test cases.</p>";
        } else {
          html += '<p class="vsub">Start with the sample — the expected output is in your copy, next to OUTPUT.</p>';
        }
      } else {
        var label = String(v || "error").replace(/-/g, " ");
        html += '<p class="vhead"><strong>' + esc(label.charAt(0).toUpperCase() + label.slice(1)) + "</strong></p>";
        if (GUIDANCE[v]) html += '<p class="vsub">' + esc(GUIDANCE[v]) + "</p>";
      }

      if (cases.length) html += caseChips(cases);
      if ((detail.lintErrors || []).length) {
        html +=
          '<ul class="vlint">' +
          detail.lintErrors.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") +
          "</ul>";
      }
      html += sampleDiff(cases);
      if (detail.message) html += '<p class="vnote">' + esc(detail.message) + "</p>";
      show(html);
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
            show('<p class="vnote">Judging — extracting your sheet and running the hidden datasets…</p>');
            setTimeout(function () { poll(id, tries + 1); }, 2500);
          }
        })
        .catch(function () { setTimeout(function () { poll(id, tries + 1); }, 4000); });
    }

    button.addEventListener("click", function () {
      var url = input.value.trim();
      if (!url) return show("Paste your sheet's share link first (Share → anyone with the link, Viewer).");
      button.disabled = true;
      show('<p class="vnote">Submitting…</p>');
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
