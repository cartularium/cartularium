(function() {
  const corpus = JSON.parse(document.getElementById('corpus').textContent);
  const targetPicker = document.getElementById('target-picker');
  const refInputs = document.querySelectorAll('input[name="ref"]');
  const summary = document.getElementById('summary');
  const tbody = document.getElementById('compare-body');
  const resultCount = document.getElementById('result-count');
  const verdictFilters = document.getElementById('verdict-filters');
  const presets = document.querySelectorAll('.preset');
  const copyBtn = document.getElementById('copy-link');

  // Persistent state via URL hash. Default: excel vs gsheets — the most
  // common cross-engine comparison; all other presets follow.
  const state = {
    target: 'excel',
    ref: ['gsheets'],
    verdicts: new Set(),
  };

  // mirrors cellsEqual + gridsEqual + toleranceFor from src/format/.
  // shape-strict: orientation differences (1×N vs N×1) are real divergences here,
  // same as the cli — surface them, don't paper over them.
  // ironcalc clips at ~9 sig figs; widen tolerance when it's in the pair.
  const DEFAULT_NUM_TOL = 1e-10;
  const PLATFORM_NUM_TOL = { ironcalc: 1e-9 };

  function toleranceFor(...engines) {
    let tol = DEFAULT_NUM_TOL;
    for (const e of engines) if (e && PLATFORM_NUM_TOL[e] > tol) tol = PLATFORM_NUM_TOL[e];
    return tol;
  }

  function isCellError(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v) && 'error' in v;
  }

  function cellsEqual(a, b, tol) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    const aErr = isCellError(a), bErr = isCellError(b);
    if (aErr && bErr) return a.error === b.error;
    if (aErr || bErr) return false;
    if (typeof a === 'number' && typeof b === 'number') {
      if (Number.isNaN(a) && Number.isNaN(b)) return true;
      const diff = Math.abs(a - b);
      const mag = Math.max(Math.abs(a), Math.abs(b), 1);
      return diff / mag < tol;
    }
    if (typeof a === 'boolean' && typeof b === 'boolean') return a === b;
    if (typeof a !== typeof b) return false;
    return String(a) === String(b);
  }

  function gridsEqual(a, b, tol) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let r = 0; r < a.length; r++) {
      if (!Array.isArray(a[r]) || !Array.isArray(b[r])) return false;
      if (a[r].length !== b[r].length) return false;
      for (let c = 0; c < a[r].length; c++) {
        if (!cellsEqual(a[r][c], b[r][c], tol)) return false;
      }
    }
    return true;
  }

  // excel array-literal syntax: `{a, b}` row, `{a; b}` column, `{a, b; c, d}` 2D.
  // larger grids collapse to `[M×N]` (square brackets mark a meta-summary).
  function fmt(v) {
    if (v === undefined || v === null) return '—';
    if (typeof v === 'object' && !Array.isArray(v) && 'error' in v) return v.error;
    if (Array.isArray(v)) {
      if (v.length === 0) return '{}';
      if (Array.isArray(v[0])) {
        if (v.length === 1 && v[0].length === 1) return fmt(v[0][0]);
        const r = v.length, c = v[0]?.length ?? 0;
        if (r * c <= 4) return '{' + v.map(row => row.map(fmt).join(', ')).join('; ') + '}';
        return `[${r}×${c}]`;
      }
      return v.length <= 4 ? '{' + v.map(fmt).join(', ') + '}' : `[${v.length}]`;
    }
    if (typeof v === 'string') return v.length > 24 ? v.slice(0, 22) + '…' : v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return String(v);
      if (Math.abs(v) < 1e-4 && v !== 0) return v.toExponential(3);
      if (Number.isInteger(v) && Math.abs(v) < 1e7) return String(v);
      const s = String(v);
      return s.length > 12 ? v.toPrecision(6) : s;
    }
    return String(v);
  }

  /** Classify one test under the current target/ref selection. */
  function classify(t) {
    const tval = t.vals[state.target];
    const refVals = state.ref.map(e => ({ engine: e, val: t.vals[e] }));
    const refsWithData = refVals.filter(r => r.val !== undefined);

    if (!refsWithData.length) return { kind: 'no-ref-data', label: 'no ref data', refVals };
    if (tval === undefined) return { kind: 'no-target-data', label: 'target skipped', refVals };

    // do all refs agree among themselves? widen tolerance pairwise so an
    // ironcalc reference doesn't artificially split from excel/gsheets.
    const first = refsWithData[0];
    const allAgree = refsWithData.every(r => gridsEqual(r.val, first.val, toleranceFor(r.engine, first.engine)));
    if (allAgree) {
      const tol = toleranceFor(state.target, ...refsWithData.map(r => r.engine));
      if (gridsEqual(tval, first.val, tol)) return { kind: 'match', label: 'matches consensus', refVals };
      return { kind: 'diverge', label: 'diverges from consensus', refVals };
    }
    // refs split internally
    const targetMatchesAny = refsWithData.some(r => gridsEqual(r.val, tval, toleranceFor(state.target, r.engine)));
    if (targetMatchesAny) return { kind: 'matches-some', label: 'matches some refs', refVals };
    return { kind: 'matches-none', label: 'matches no refs', refVals };
  }

  const VERDICTS = ['match', 'matches-some', 'diverge', 'matches-none', 'no-target-data', 'no-ref-data'];
  const VERDICT_LABELS = {
    'match': 'matches consensus',
    'matches-some': 'matches some refs',
    'diverge': 'diverges from consensus',
    'matches-none': 'matches no refs',
    'no-target-data': 'target skipped',
    'no-ref-data': 'no ref data',
  };

  function render() {
    if (!state.ref.length) {
      summary.innerHTML = '<p class="hint">Pick at least one reference engine.</p>';
      tbody.innerHTML = '';
      verdictFilters.innerHTML = '';
      resultCount.textContent = '';
      return;
    }
    if (state.ref.includes(state.target)) {
      summary.innerHTML = '<p class="hint">Target engine cannot also be a reference. Adjust the selection above.</p>';
      tbody.innerHTML = '';
      verdictFilters.innerHTML = '';
      resultCount.textContent = '';
      return;
    }

    // Classify all tests
    const results = corpus.tests.map(t => ({ t, c: classify(t) }));
    const counts = { match: 0, 'matches-some': 0, diverge: 0, 'matches-none': 0, 'no-target-data': 0, 'no-ref-data': 0 };
    for (const r of results) counts[r.c.kind]++;

    const compared = counts['match'] + counts['matches-some'] + counts['diverge'] + counts['matches-none'];
    const supported = counts['match'] + counts['matches-some'];
    const supportPct = compared ? ((supported / compared) * 100).toFixed(1) : '0.0';
    const matchPct = compared ? ((counts['match'] / compared) * 100).toFixed(1) : '0.0';

    summary.innerHTML = `
      <div class="summary-grid">
        <div class="summary-tile primary">
          <div class="summary-num">${supportPct}<span class="pct">%</span></div>
          <div class="summary-label">supported<br><span class="muted">${supported.toLocaleString()} / ${compared.toLocaleString()} comparable tests</span></div>
        </div>
        <div class="summary-tile">
          <div class="summary-num">${counts['match'].toLocaleString()}</div>
          <div class="summary-label">match consensus<br><span class="muted">${matchPct}% of comparable</span></div>
        </div>
        <div class="summary-tile">
          <div class="summary-num">${counts['matches-some'].toLocaleString()}</div>
          <div class="summary-label">match some refs<br><span class="muted">refs disagreed; target sided with one</span></div>
        </div>
        <div class="summary-tile warn">
          <div class="summary-num">${counts['diverge'].toLocaleString()}</div>
          <div class="summary-label">diverge from consensus<br><span class="muted">refs agreed; target disagreed</span></div>
        </div>
        <div class="summary-tile danger">
          <div class="summary-num">${counts['matches-none'].toLocaleString()}</div>
          <div class="summary-label">match no refs<br><span class="muted">refs split; target unique</span></div>
        </div>
        <div class="summary-tile muted">
          <div class="summary-num">${(counts['no-target-data'] + counts['no-ref-data']).toLocaleString()}</div>
          <div class="summary-label">no comparison<br><span class="muted">missing fixture data</span></div>
        </div>
      </div>
    `;

    // Verdict filter chips
    verdictFilters.innerHTML = VERDICTS.map(v => {
      const selected = state.verdicts.has(v);
      return `<label class="verdict-chip verdict-${v}${selected ? ' selected' : ''}">
        <input type="checkbox" data-verdict="${v}" ${selected ? 'checked' : ''}>
        <span class="dot"></span>
        ${VERDICT_LABELS[v]}
      </label>`;
    }).join('');

    // Filter & render rows. Default if no chips selected: hide the "match" rows
    // (so failure modes are visible by default).
    const activeVerdicts = state.verdicts.size > 0
      ? state.verdicts
      : new Set(VERDICTS.filter(v => v !== 'match' && v !== 'no-target-data' && v !== 'no-ref-data'));

    const filtered = results.filter(r => activeVerdicts.has(r.c.kind));
    resultCount.textContent = `${filtered.length} of ${results.length}`;

    tbody.innerHTML = filtered.slice(0, 1000).map(({ t, c }) => {
      const causeChip = (eng) => t.causes && t.causes[eng]
        ? `<span class="cause-chip" title="${eng} override: cause=${t.causes[eng]}">${t.causes[eng]}</span>`
        : '';
      const targetVal = c.refVals.length
        ? `${fmt(t.vals[state.target])}${causeChip(state.target)}`
        : '—';
      const refSummary = c.refVals.map(r => {
        const cls = r.val === undefined ? 'no-data' : '';
        return `<span class="ref-val ${cls}"><span class="chip eng eng-${r.engine}">${r.engine}</span>${fmt(r.val)}${causeChip(r.engine)}</span>`;
      }).join('');
      const expectedDisplay = t.expect === undefined ? '<span class="muted">—</span>' : fmt(t.expect);
      const dvLinks = (t.dvs || []).slice(0, 2).map(d => `<a href="dv/${d}">${d}</a>`).join(' ');
      const dvExtra = t.dvs.length > 2 ? `<span class="muted">+${t.dvs.length - 2}</span>` : '';
      return `<tr class="verdict-row verdict-${c.kind}">
        <td><code>${t.id}</code></td>
        <td>${t.subject}</td>
        <td><code class="formula">${escapeHTML(t.formula)}</code></td>
        <td class="expected-val">${expectedDisplay}</td>
        <td><span class="verdict-tag verdict-${c.kind}">${VERDICT_LABELS[c.kind]}</span></td>
        <td class="target-val">${targetVal}</td>
        <td class="ref-vals"><div class="ref-vals-inner">${refSummary}</div></td>
        <td class="dv-links">${dvLinks}${dvExtra}</td>
      </tr>`;
    }).join('');

    if (filtered.length > 1000) {
      tbody.innerHTML += `<tr><td colspan="8" class="muted truncated">… ${filtered.length - 1000} more rows hidden. Use verdict filters or refine selection.</td></tr>`;
    }
  }

  function escapeHTML(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function syncFromState() {
    targetPicker.value = state.target;
    for (const inp of refInputs) inp.checked = state.ref.includes(inp.value);
  }

  function applyHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const t = params.get('target');
    const r = params.get('ref');
    const v = params.get('verdicts');
    if (t) state.target = t;
    if (r) state.ref = r.split(',').filter(Boolean);
    if (v) state.verdicts = new Set(v.split(',').filter(Boolean));
    syncFromState();
  }

  function writeHash() {
    const params = new URLSearchParams();
    params.set('target', state.target);
    params.set('ref', state.ref.join(','));
    if (state.verdicts.size) params.set('verdicts', [...state.verdicts].join(','));
    history.replaceState(null, '', '#' + params.toString());
  }

  // Wire interactions
  targetPicker.addEventListener('change', () => {
    state.target = targetPicker.value;
    writeHash();
    render();
  });
  refInputs.forEach(inp => {
    inp.addEventListener('change', () => {
      state.ref = Array.from(refInputs).filter(i => i.checked).map(i => i.value);
      writeHash();
      render();
    });
  });
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      state.target = btn.dataset.target;
      state.ref = btn.dataset.ref.split(',');
      state.verdicts = new Set();
      syncFromState();
      writeHash();
      render();
    });
  });
  verdictFilters.addEventListener('change', (e) => {
    if (e.target.matches('input[data-verdict]')) {
      const v = e.target.dataset.verdict;
      if (e.target.checked) state.verdicts.add(v);
      else state.verdicts.delete(v);
      writeHash();
      render();
    }
  });
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy permalink', 1500);
    } catch {}
  });

  applyHash();
  render();
})();
