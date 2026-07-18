(function() {
  const search = document.getElementById('search');
  if (!search) return; // not on the index page

  const tbody = document.querySelector('#dv-table tbody');
  const allRows = Array.from(tbody.rows);
  const resultCount = document.getElementById('result-count');
  const clearBtn = document.getElementById('clear-filters');

  const groups = {
    engine: document.querySelector('.filter-group[data-key="engine"]'),
    cause: document.querySelector('.filter-group[data-key="cause"]'),
    category: document.querySelector('.filter-group[data-key="category"]'),
  };
  const allDetails = Array.from(document.querySelectorAll('.filters details'));

  function getChecked(group) {
    if (!group) return [];
    return Array.from(group.querySelectorAll('input[type=checkbox]:checked'))
      .map(cb => cb.value);
  }

  function applyFilters() {
    const q = search.value.trim().toLowerCase();
    const engines = getChecked(groups.engine);
    const causes = getChecked(groups.cause);
    const categories = getChecked(groups.category);
    let visible = 0;
    for (const row of allRows) {
      const blob = row.dataset.search || '';
      const rowEngines = (row.dataset.engines || '').split(',');
      const rowCause = row.dataset.cause || '';
      const rowCategory = row.dataset.category || '';

      const matchSearch = !q || blob.includes(q);
      const matchEngines = !engines.length || engines.some(e => rowEngines.includes(e));
      const matchCauses = !causes.length || causes.includes(rowCause);
      const matchCategories = !categories.length || categories.includes(rowCategory);

      const show = matchSearch && matchEngines && matchCauses && matchCategories;
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    }
    if (resultCount) {
      resultCount.textContent = visible === allRows.length
        ? `${visible} entries`
        : `${visible} of ${allRows.length}`;
    }
    writeHash({ search: search.value, engines, causes, categories });
  }

  function writeHash(state) {
    const params = new URLSearchParams();
    if (state.search) params.set('search', state.search);
    if (state.engines.length) params.set('engines', state.engines.join(','));
    if (state.causes.length) params.set('causes', state.causes.join(','));
    if (state.categories.length) params.set('categories', state.categories.join(','));
    const s = params.toString();
    const next = s ? '#' + s : location.pathname + location.search;
    if (location.hash.slice(1) !== s) history.replaceState(null, '', next);
  }

  function applyHash() {
    const hash = location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const sq = params.get('search');
    if (sq != null) search.value = sq;
    for (const [key, group] of Object.entries(groups)) {
      const paramKey = { engine: 'engines', cause: 'causes', category: 'categories' }[key];
      const vals = (params.get(paramKey) || '').split(',').filter(Boolean);
      if (!group) continue;
      group.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.checked = vals.includes(cb.value);
      });
    }
  }

  // Auto-close other dropdowns when one opens (and on outside-click).
  for (const d of allDetails) {
    d.addEventListener('toggle', () => {
      if (d.open) {
        for (const o of allDetails) if (o !== d) o.open = false;
      }
    });
  }
  document.addEventListener('click', (e) => {
    for (const d of allDetails) {
      if (d.open && !d.contains(e.target)) d.open = false;
    }
  });

  search.addEventListener('input', applyFilters);
  for (const g of Object.values(groups)) {
    if (g) g.addEventListener('change', applyFilters);
  }
  clearBtn.addEventListener('click', () => {
    search.value = '';
    for (const g of Object.values(groups)) {
      if (!g) continue;
      g.querySelectorAll('input[type=checkbox]:checked').forEach(cb => cb.checked = false);
    }
    applyFilters();
  });

  // Sortable columns
  const headers = document.querySelectorAll('#dv-table th[data-sort]');
  let sortState = { col: null, asc: true };
  headers.forEach((th, i) => {
    th.addEventListener('click', () => {
      const kind = th.dataset.sort;
      const asc = sortState.col === i ? !sortState.asc : true;
      sortState = { col: i, asc };
      const sorted = [...allRows].sort((a, b) => {
        const av = a.cells[i].textContent.trim();
        const bv = b.cells[i].textContent.trim();
        if (kind === 'num') return asc ? +av - +bv : +bv - +av;
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      sorted.forEach(r => tbody.appendChild(r));
    });
  });

  applyHash();
  applyFilters();
})();
