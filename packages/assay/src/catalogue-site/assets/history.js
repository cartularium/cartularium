(async function() {
  const dataMarker = document.getElementById('history-data');
  const targetInputs = document.querySelectorAll('input[name="target"]');
  const refInputs = document.querySelectorAll('input[name="ref"]');
  const presets = document.querySelectorAll('.preset');
  const summaryEl = document.getElementById('summary');
  const svg = document.getElementById('history-chart');
  const legend = document.getElementById('history-legend');
  const tbody = document.getElementById('history-body');

  if (dataMarker?.dataset.empty === '1') return;

  const dataUrl = new URL('../assets/agreement-history.json', window.location.href);
  if (window.__ASSAY_ASSET_VERSION__) dataUrl.searchParams.set('v', window.__ASSAY_ASSET_VERSION__);
  let data;
  try {
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    summaryEl.innerHTML = `<p class="empty">Could not load agreement-history.json — ${e.message}</p>`;
    return;
  }

  if (!data.runs || data.runs.length === 0) return;

  const state = {
    targets: ['lattice', 'ironcalc', 'hyperformula'],
    ref: ['excel', 'gsheets'],
  };

  // replay deltas → per-run state. each run snapshot has byTest:
  // Map<test_id, { engine: hash, ... }>
  const runStates = (() => {
    const out = [];
    const cur = new Map();
    for (const run of data.runs) {
      for (const d of run.delta) {
        const key = d.tid + '|' + d.engine;
        if (d.to === null) cur.delete(key);
        else cur.set(key, d.to);
      }
      const byTest = new Map();
      for (const [key, hash] of cur) {
        const sep = key.indexOf('|');
        const tid = key.slice(0, sep);
        const eng = key.slice(sep + 1);
        let m = byTest.get(tid);
        if (!m) { m = {}; byTest.set(tid, m); }
        m[eng] = hash;
      }
      out.push({ run, byTest });
    }
    return out;
  })();

  // mirrors compare.js. shape-strict; numeric tolerance widens when IronCalc
  // is in the comparison so history and compare report the same percentage.
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

  // verdict for one (target, refs, test)
  function classify(perEngine, target, refs) {
    const tval = perEngine[target];
    const refVals = refs.map((e) => ({ engine: e, val: perEngine[e] })).filter((r) => r.val !== undefined);
    if (refVals.length === 0) return 'no-ref-data';
    if (tval === undefined) return 'no-target-data';
    const first = refVals[0];
    const allAgree = refVals.every((r) => gridsEqual(r.val, first.val, toleranceFor(r.engine, first.engine)));
    if (allAgree) {
      const tol = toleranceFor(target, ...refVals.map((r) => r.engine));
      return gridsEqual(tval, first.val, tol) ? 'match' : 'diverge';
    }
    return refVals.some((r) => gridsEqual(r.val, tval, toleranceFor(target, r.engine))) ? 'matches-some' : 'matches-none';
  }

  function tallyTarget(byTest, target, refs) {
    const out = { 'match': 0, 'matches-some': 0, 'matches-none': 0, 'diverge': 0, 'no-target-data': 0, 'no-ref-data': 0 };
    for (const perEngine of byTest.values()) out[classify(perEngine, target, refs)]++;
    return out;
  }

  function comparableTotal(tally) {
    return tally['match'] + tally['matches-some'] + tally['matches-none'] + tally['diverge'];
  }

  function supportedTotal(tally) {
    return tally['match'] + tally['matches-some'];
  }

  // 8-color palette readable on light + dark. assigned per target
  const PALETTE = ['#1f6f6f', '#d97757', '#9b6dd0', '#5a8c3f', '#c44569', '#7a8c1d', '#3d7da8', '#a55a1f'];
  function colorFor(target) {
    let i = 0;
    for (let k = 0; k < target.length; k++) i = (i * 31 + target.charCodeAt(k)) | 0;
    return PALETTE[(i >>> 0) % PALETTE.length];
  }

  // svg geometry — viewBox in template is 900×420
  const W = 900, H = 420;
  const M = { top: 16, right: 24, bottom: 56, left: 56 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const SVGNS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, text) {
    const e = document.createElementNS(SVGNS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function xAt(i, total) {
    if (total <= 1) return M.left + innerW / 2;
    return M.left + (i / (total - 1)) * innerW;
  }
  function yAt(pct) { return M.top + (1 - pct / 100) * innerH; }

  function renderChart() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const total = runStates.length;

    for (const pct of [0, 25, 50, 75, 100]) {
      const y = yAt(pct);
      svg.appendChild(el('line', { x1: M.left, x2: M.left + innerW, y1: y, y2: y, class: 'grid-line' }));
      svg.appendChild(el('text', { x: M.left - 8, y: y + 4, class: 'axis-label', 'text-anchor': 'end' }, pct + '%'));
    }
    const tickIdx = total === 1 ? [0]
      : total <= 4 ? runStates.map((_, i) => i)
      : [0, Math.floor(total / 2), total - 1];
    for (const i of tickIdx) {
      const x = xAt(i, total);
      svg.appendChild(el('line', { x1: x, x2: x, y1: M.top, y2: M.top + innerH, class: 'grid-line grid-line-faint' }));
      svg.appendChild(el('text', { x, y: M.top + innerH + 22, class: 'axis-label', 'text-anchor': 'middle' }, runStates[i].run.ts.slice(0, 10)));
    }

    if (state.targets.length === 0 || state.ref.length === 0) {
      svg.appendChild(el('text', {
        x: M.left + innerW / 2, y: M.top + innerH / 2,
        class: 'axis-label', 'text-anchor': 'middle',
      }, state.targets.length === 0 ? 'Pick at least one target.' : 'Pick at least one reference engine.'));
      return;
    }

    // line per target — supported% over time, matching compare's primary metric.
    for (const target of state.targets) {
      const color = colorFor(target);
      const pts = runStates.map((rs, i) => {
        const t = tallyTarget(rs.byTest, target, state.ref);
        const total = comparableTotal(t) || 1;
        return { i, pct: (supportedTotal(t) / total) * 100 };
      });
      if (pts.length >= 2) {
        const d = pts.map((p, k) => (k === 0 ? 'M' : 'L') + xAt(p.i, runStates.length) + ',' + yAt(p.pct)).join(' ');
        svg.appendChild(el('path', {
          d, fill: 'none', 'stroke-width': '2',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          style: `stroke: ${color}`,
        }));
      }
      for (const p of pts) {
        const dot = el('circle', {
          cx: xAt(p.i, runStates.length), cy: yAt(p.pct), r: '4',
          style: `fill: ${color}; stroke: var(--paper); stroke-width: 1.5`,
        });
        const title = el('title', {}, `${target}: ${p.pct.toFixed(1)}% supported  ·  ${runStates[p.i].run.ts.slice(0, 10)}`);
        dot.appendChild(title);
        svg.appendChild(dot);
      }
    }

    legend.innerHTML = '';
    for (const target of state.targets) {
      const item = document.createElement('span');
      item.className = 'legend-item';
      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      swatch.style.background = colorFor(target);
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(target));
      legend.appendChild(item);
    }
  }

  function renderTable() {
    tbody.innerHTML = '';
    if (state.ref.length === 0 || state.targets.length === 0) return;
    for (const rs of runStates) {
      let first = true;
      for (const target of state.targets) {
        const t = tallyTarget(rs.byTest, target, state.ref);
        const comparable = comparableTotal(t);
        const tr = document.createElement('tr');
        tr.innerHTML =
          `<td>${first ? rs.run.ts.slice(0, 16).replace('T', ' ') : ''}</td>` +
          `<td>${target}</td>` +
          `<td>${first ? comparable : ''}</td>` +
          `<td>${t['match']}</td>` +
          `<td>${t['matches-some']}</td>` +
          `<td>${t['diverge'] + t['matches-none']}</td>` +
          `<td>${t['no-target-data'] + t['no-ref-data']}</td>`;
        tbody.appendChild(tr);
        first = false;
      }
    }
  }

  function renderSummary() {
    if (state.ref.length === 0 || state.targets.length === 0) {
      summaryEl.innerHTML = `<p class="empty">${state.targets.length === 0 ? 'Pick at least one target.' : 'Pick at least one reference engine.'}</p>`;
      return;
    }
    const latest = runStates[runStates.length - 1];
    const tiles = state.targets.map((target) => {
      const t = tallyTarget(latest.byTest, target, state.ref);
      const total = comparableTotal(t) || 1;
      const supportPct = (supportedTotal(t) / total * 100).toFixed(1);
      const color = colorFor(target);
      return `<div class="summary-tile">
        <div class="summary-num" style="color: ${color}">${supportPct}<span class="pct">%</span></div>
        <div class="summary-label">${target}<span class="muted">supported, latest</span></div>
      </div>`;
    });
    summaryEl.innerHTML = `<div class="summary-grid">${tiles.join('')}</div>`;
  }

  function update() {
    renderSummary();
    renderChart();
    renderTable();
  }

  function syncControls() {
    for (const cb of targetInputs) cb.checked = state.targets.includes(cb.value);
    for (const cb of refInputs) cb.checked = state.ref.includes(cb.value);
  }

  for (const cb of targetInputs) {
    cb.addEventListener('change', () => {
      state.targets = Array.from(targetInputs).filter((c) => c.checked).map((c) => c.value);
      update();
    });
  }
  for (const cb of refInputs) {
    cb.addEventListener('change', () => {
      state.ref = Array.from(refInputs).filter((c) => c.checked).map((c) => c.value);
      update();
    });
  }
  for (const btn of presets) {
    btn.addEventListener('click', () => {
      // presets set ONE target; multi-target users start from a preset, then
      // toggle additional targets. matches the compare-page muscle memory
      state.targets = [btn.dataset.target];
      state.ref = btn.dataset.ref.split(',');
      syncControls();
      update();
    });
  }

  syncControls();
  update();
})();
