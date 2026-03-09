/* Trade Price Calculator */
const tradeCalc = (function () {
  const PRESETS_KEY = 'poe_trade_presets';
  const WORKING_KEY = 'poe_trade_working';
  const TARGET      = document.getElementById('tool-trade');
  const DIV_IMG     = 'assets/div.png';
  const CHAOS_IMG   = 'assets/chaos.png';

  const DEFAULT_PRESET = {
    name: 'Main',
    exchangeRate: 160,
    requestHeader: '',
    requestFooter: '',
    calculators: [
      { id: 1, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
      { id: 2, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
      { id: 3, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
      { id: 4, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
      { id: 5, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
      { id: 6, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
      { id: 7, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
      { id: 8, label: '', totalQuantity: 0, price: 0, currencyType: 'д' },
    ]
  };

  const BEASTS_PRESET = {
    name: 'POE BEAST',
    exchangeRate: 160,
    requestHeader: 'WTS Softcore',
    requestFooter: ' IGN: @YOUNICKNAME',
    calculators: [
      { id: 1, label: 'Vivid Watcher',           totalQuantity: 0, price: 1.4, currencyType: 'д' },
      { id: 2, label: 'Vivid Vulture',            totalQuantity: 0, price: 0.7, currencyType: 'д' },
      { id: 3, label: 'Wild Bristle Matron',      totalQuantity: 0, price: 0.7, currencyType: 'д' },
      { id: 4, label: 'Wild Brambleback',         totalQuantity: 0, price: 0.2, currencyType: 'д' },
      { id: 5, label: 'Wild Hellion Alpha',       totalQuantity: 0, price: 0.4, currencyType: 'д' },
      { id: 6, label: 'Fenumal Plagued Arachnid', totalQuantity: 0, price: 0.1, currencyType: 'д' },
      { id: 7, label: 'Craicic chimeral',         totalQuantity: 0, price: 0.7, currencyType: 'д' },
      { id: 8, label: 'Black Morrigan',           totalQuantity: 0, price: 1.0, currencyType: 'д' },
    ]
  };

  // ── State ──────────────────────────────────────────────
  // state.presets   — збережені пресети, не мутуються під час редагування
  // state.working   — робоча копія, мутується вільно, не впливає на presets
  // state.loadedName — ім'я пресету, з якого зроблено working copy
  let state = {
    presets:     [deepCopy(DEFAULT_PRESET), deepCopy(BEASTS_PRESET)],
    loadedName:  'Main',
    working:     deepCopy(DEFAULT_PRESET),
    soldAmounts: {},
    showPresetPanel: false,
  };

  function deepCopy(o) { return JSON.parse(JSON.stringify(o)); }

  // ── Storage ────────────────────────────────────────────
  function savePresets() {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(state.presets)); } catch (e) {}
  }

  function saveWorking() {
    try {
      localStorage.setItem(WORKING_KEY, JSON.stringify({
        loadedName: state.loadedName,
        working:    state.working,
      }));
    } catch (e) {}
  }

  function loadFromStorage() {
    try {
      const sp = localStorage.getItem(PRESETS_KEY);
      if (sp) {
        const parsed = JSON.parse(sp);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.presets = parsed.map(p => ({
            ...p,
            requestHeader: p.requestHeader || '',
            requestFooter: p.requestFooter || '',
          }));
        }
      }
      const sw = localStorage.getItem(WORKING_KEY);
      if (sw) {
        const { loadedName, working } = JSON.parse(sw);
        if (isValidPreset(working)) {
          state.loadedName = loadedName || working.name;
          state.working    = { ...working, requestHeader: working.requestHeader || '', requestFooter: working.requestFooter || '' };
        }
      }
    } catch (e) {}
  }

  function isValidPreset(p) {
    return p && typeof p.name === 'string' && typeof p.exchangeRate === 'number' &&
      Array.isArray(p.calculators) && p.calculators.every(c =>
        typeof c.id === 'number' && typeof c.label === 'string' &&
        typeof c.totalQuantity === 'number' && typeof c.price === 'number' &&
        (c.currencyType === 'д' || c.currencyType === 'с'));
  }

  // ── Preset actions ─────────────────────────────────────

  /** Завантажити пресет: робить deepCopy з presets → working */
  function loadPreset(name) {
    const preset = state.presets.find(p => p.name === name);
    if (!preset) return;
    state.loadedName  = name;
    state.working     = deepCopy(preset);
    state.soldAmounts = {};
    saveWorking();
    render();
  }

  /** Зберегти як новий пресет */
  function savePreset(name) {
    if (!name) { alert('Enter a preset name'); return; }
    if (state.presets.some(p => p.name === name)) { alert('A preset with this name already exists'); return; }
    const newPreset  = deepCopy(state.working);
    newPreset.name   = name;
    state.presets.push(newPreset);
    state.loadedName = name;
    state.working    = deepCopy(newPreset);
    savePresets();
    saveWorking();
    render();
    alert(`Preset "${name}" saved!`);
  }

  /** Перезаписати поточний пресет робочим станом */
  function overwriteCurrentPreset() {
    if (!confirm(`Overwrite preset "${state.loadedName}" with current settings?`)) return;
    const idx = state.presets.findIndex(p => p.name === state.loadedName);
    if (idx !== -1) {
      state.presets[idx] = deepCopy(state.working);
      state.presets[idx].name = state.loadedName;
    } else {
      const copy = deepCopy(state.working);
      copy.name = state.loadedName;
      state.presets.push(copy);
    }
    savePresets();
    alert(`Preset "${state.loadedName}" updated!`);
  }

  function deletePreset(name) {
    if (name === 'Main') { alert('Cannot delete the Main preset'); return; }
    if (!confirm(`Delete preset "${name}"?`)) return;
    state.presets = state.presets.filter(p => p.name !== name);
    savePresets();
    loadPreset('Main');
  }

  function exportPreset() {
    const data = btoa(encodeURIComponent(JSON.stringify(state.working)));
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(data).then(() => alert('Export code copied!'))
        .catch(() => alert('Copy this code:\n\n' + data));
    } else {
      alert('Copy this code:\n\n' + data);
    }
  }

  function importPreset(base64) {
    if (!base64.trim()) { alert('Enter a base64 string'); return; }
    try {
      const preset   = JSON.parse(decodeURIComponent(atob(base64.trim())));
      const migrated = { ...preset, requestHeader: preset.requestHeader || '', requestFooter: preset.requestFooter || '' };
      if (!isValidPreset(migrated)) { alert('Invalid preset data'); return; }
      let name = migrated.name, c = 1;
      while (state.presets.some(p => p.name === name)) name = migrated.name + ' (' + c++ + ')';
      migrated.name = name;
      state.presets.push(migrated);
      savePresets();
      loadPreset(name);
      alert('Preset imported!');
    } catch (e) {
      alert('Import error — check the base64 string');
    }
  }

  // ── Working state mutators ─────────────────────────────
  // Всі ці функції змінюють ТІЛЬКИ state.working, не state.presets

  function updateCalc(id, updates) {
    const calc = state.working.calculators.find(c => c.id === id);
    if (calc) Object.assign(calc, updates);
    saveWorking();
  }

  function updateExchangeRate(val) {
    state.working.exchangeRate = parseFloat((val || '').replace(',', '.')) || 0;
    saveWorking();
    renderSummary();
  }

  function updateHeader(val) { state.working.requestHeader = val; saveWorking(); }
  function updateFooter(val) { state.working.requestFooter = val; saveWorking(); }

  function addCalculator() {
    if (state.working.calculators.length >= 20) return;
    const newId = Math.max(...state.working.calculators.map(c => c.id)) + 1;
    state.working.calculators.push({ id: newId, label: '', totalQuantity: 0, price: 0, currencyType: 'д' });
    saveWorking();
    render();
  }

  function removeCalculator(id) {
    if (state.working.calculators.length <= 1) return;
    if (!confirm('Remove this calculator?')) return;
    state.working.calculators = state.working.calculators.filter(c => c.id !== id);
    delete state.soldAmounts[id];
    saveWorking();
    render();
  }

  function markAsSold(id) {
    const sold = state.soldAmounts[id] || 0;
    if (sold <= 0) return;
    const calc = state.working.calculators.find(c => c.id === id);
    if (calc) calc.totalQuantity = Math.max(0, calc.totalQuantity - sold);
    state.soldAmounts[id] = 0;
    saveWorking();
    render();
  }

  function resetAllTotals() {
    if (!confirm('Reset all total quantities to 0?')) return;
    state.working.calculators.forEach(c => { c.totalQuantity = 0; });
    saveWorking();
    render();
  }

  function soldAll() {
    if (!confirm('Mark all sold quantities as sold?')) return;
    state.working.calculators.forEach(c => {
      const sold = state.soldAmounts[c.id] || 0;
      if (sold > 0) c.totalQuantity = Math.max(0, c.totalQuantity - sold);
    });
    state.soldAmounts = {};
    saveWorking();
    render();
  }

  // ── Calculations ───────────────────────────────────────
  function calcSummary() {
    const rate = state.working.exchangeRate || 160;
    let totalD = 0, totalC = 0;
    state.working.calculators.forEach(c => {
      const val = (state.soldAmounts[c.id] || 0) * c.price;
      if (c.currencyType === 'д') totalD += val; else totalC += val;
    });
    const totalInC   = totalC + totalD * rate;
    const wholeDPart = Math.floor(totalInC / rate);
    const remainderC = totalInC - wholeDPart * rate;
    return { totalD, totalC, totalInC, wholeDPart, remainderC };
  }

  // ── Rendering ──────────────────────────────────────────
  function currencyImg(type, cls) {
    const src = type === 'д' ? DIV_IMG : CHAOS_IMG;
    const alt = type === 'д' ? 'div' : 'chaos';
    return `<img src="${src}" class="${cls || 'currency-img'}" alt="${alt}">`;
  }

  function renderCalcCard(calc) {
    const sold   = state.soldAmounts[calc.id] || 0;
    const result = sold * calc.price;
    const solo   = state.working.calculators.length <= 1;
    return `
    <div class="calc-card fade-up" data-id="${calc.id}">
      <div class="calc-card-head">
        <input type="text" class="calc-label-input"
          placeholder="Calculator_${calc.id}"
          value="${escHtml(calc.label)}"
          data-action="label" data-id="${calc.id}">
        <button class="calc-remove-btn" data-action="remove" data-id="${calc.id}"
          ${solo ? 'disabled' : ''} title="Remove">×</button>
      </div>
      <div class="calc-field">
        <label>Total Quantity</label>
        <input type="text" inputmode="decimal" placeholder="0"
          value="${calc.totalQuantity || ''}"
          data-action="total" data-id="${calc.id}">
      </div>
      <div class="calc-field">
        <label>Price / ea</label>
        <input type="text" inputmode="decimal" placeholder="0"
          value="${calc.price || ''}"
          data-action="price" data-id="${calc.id}">
      </div>
      <div class="calc-field">
        <label>Currency</label>
        <div class="currency-selector">
          <div class="currency-option ${calc.currencyType === 'д' ? 'selected' : ''}"
            data-action="currency" data-id="${calc.id}" data-currency="д">
            ${currencyImg('д', 'currency-img-sm')} Divine
          </div>
          <div class="currency-option ${calc.currencyType === 'с' ? 'selected' : ''}"
            data-action="currency" data-id="${calc.id}" data-currency="с">
            ${currencyImg('с', 'currency-img-sm')} Chaos
          </div>
        </div>
      </div>
      <div class="sold-row">
        <input type="text" inputmode="decimal" placeholder="Qty sold"
          value="${sold || ''}"
          data-action="sold" data-id="${calc.id}">
        <button class="poe-btn poe-btn-yellow sold-btn"
          data-action="mark-sold" data-id="${calc.id}"
          ${sold <= 0 ? 'disabled' : ''}>Sold</button>
      </div>
      <div class="calc-result-line">
        <span>${sold}</span>
        <span style="color:var(--text-dim)">×</span>
        <span>${calc.price || 0}</span>
        <span style="color:var(--text-dim)">=</span>
        <span class="result-num">${result.toFixed(2)}</span>
        ${currencyImg(calc.currencyType)}
      </div>
    </div>`;
  }

  function renderSummary() {
    const el = document.getElementById('trade-summary');
    if (!el) return;
    const s = calcSummary();
    el.innerHTML = `
      <div class="summary-section">
        <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div><div class="corner corner-br"></div>
        <div class="summary-head">
          <h3>Summary</h3>
          <button class="poe-btn poe-btn-yellow" id="sold-all-btn">Sold All</button>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-item-label">Divine total ${currencyImg('д', 'currency-img-sm')}</div>
            <div class="summary-item-value">${s.totalD.toFixed(2)} ${currencyImg('д')}</div>
          </div>
          <div class="summary-item">
            <div class="summary-item-label">Chaos total ${currencyImg('с', 'currency-img-sm')}</div>
            <div class="summary-item-value">${s.totalC.toFixed(2)} ${currencyImg('с')}</div>
          </div>
          <div class="summary-item total-item">
            <div class="summary-item-label">All in Chaos ${currencyImg('с', 'currency-img-sm')}</div>
            <div class="summary-item-value">${s.totalInC.toFixed(2)} ${currencyImg('с')}</div>
          </div>
          <div class="summary-item total-item">
            <div class="summary-item-label">All in Divine + rest</div>
            <div class="summary-item-value">
              ${s.wholeDPart} ${currencyImg('д')}
              ${s.remainderC.toFixed(2)} ${currencyImg('с')}
            </div>
          </div>
        </div>
      </div>`;
    document.getElementById('sold-all-btn').addEventListener('click', soldAll);
  }

  function render() {
    const w = state.working;
    TARGET.innerHTML = `
    <div class="tool-page">
      <div class="tool-header">
        <div class="icon-pips">
          <div class="icon-pip active"></div>
          <div class="icon-pip active"></div>
          <div class="icon-pip active"></div>
        </div>
        <h2 class="tool-title">Trade Calculator</h2>
        <div class="tool-subtitle">Quantities · Prices · Presets · Request Generator</div>
      </div>

      <div class="trade-header-row">
        <div class="trade-controls-row">
          <div class="exchange-rate-wrap">
            1 ${currencyImg('д', 'currency-img-sm')} =
            <input type="text" inputmode="decimal" id="trade-exchange-rate"
              value="${w.exchangeRate}" title="Divine to Chaos rate">
            ${currencyImg('с', 'currency-img-sm')}
          </div>
          <button class="poe-btn poe-btn-yellow" id="reset-totals-btn">↺ Reset Totals</button>
          <div class="preset-row">
            <select id="preset-select">
              ${state.presets.map(p =>
                `<option value="${escHtml(p.name)}" ${p.name === state.loadedName ? 'selected' : ''}>${escHtml(p.name)}</option>`
              ).join('')}
            </select>
            <button class="poe-btn poe-btn-dim poe-btn-icon" id="preset-toggle-btn" title="Manage presets">⚙</button>
          </div>
        </div>
      </div>

      <div class="preset-panel ${state.showPresetPanel ? 'open' : ''}" id="preset-panel">
        <div class="preset-panel-inner">
          <div class="preset-row-inner">
            <input type="text" id="new-preset-name" placeholder="New preset name…">
            <button class="poe-btn poe-btn-green  poe-btn-icon" id="save-preset-btn"      title="Save as new preset">💾</button>
            <button class="poe-btn poe-btn-blue   poe-btn-icon" id="overwrite-preset-btn" title="Overwrite current preset">↻</button>
            <button class="poe-btn poe-btn-red    poe-btn-icon" id="delete-preset-btn"
              ${state.loadedName === 'Main' ? 'disabled' : ''} title="Delete current preset">🗑</button>
          </div>
          <div class="preset-row-inner">
            <input type="text" id="import-input" placeholder="Base64 string to import…">
            <button class="poe-btn poe-btn-yellow poe-btn-icon" id="export-preset-btn" title="Export current preset">📤</button>
            <button class="poe-btn poe-btn-blue   poe-btn-icon" id="import-preset-btn" title="Import preset">📥</button>
          </div>
        </div>
      </div>

      <div class="trade-actions-row">
        <button class="poe-btn poe-btn-green" id="add-calc-btn"
          ${w.calculators.length >= 20 ? 'disabled' : ''}>+ Add Calculator</button>
        <button class="poe-btn poe-btn-blue" id="gen-request-btn">📝 Generate Request</button>
      </div>

      <div class="calculators-grid" id="calc-grid">
        ${w.calculators.map(renderCalcCard).join('')}
      </div>

      <div id="trade-summary"></div>
    </div>`;

    renderSummary();
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('trade-exchange-rate').addEventListener('input', function () {
      updateExchangeRate(this.value);
    });

    document.getElementById('preset-select').addEventListener('change', function () {
      loadPreset(this.value);
    });

    document.getElementById('preset-toggle-btn').addEventListener('click', function () {
      state.showPresetPanel = !state.showPresetPanel;
      document.getElementById('preset-panel').classList.toggle('open', state.showPresetPanel);
    });

    document.getElementById('save-preset-btn').addEventListener('click', function () {
      savePreset(document.getElementById('new-preset-name').value.trim());
    });
    document.getElementById('overwrite-preset-btn').addEventListener('click', overwriteCurrentPreset);
    document.getElementById('delete-preset-btn').addEventListener('click', function () {
      deletePreset(state.loadedName);
    });
    document.getElementById('export-preset-btn').addEventListener('click', exportPreset);
    document.getElementById('import-preset-btn').addEventListener('click', function () {
      importPreset(document.getElementById('import-input').value);
    });

    document.getElementById('add-calc-btn').addEventListener('click', addCalculator);
    document.getElementById('reset-totals-btn').addEventListener('click', resetAllTotals);
    document.getElementById('gen-request-btn').addEventListener('click', openRequestModal);

    const grid = document.getElementById('calc-grid');

    grid.addEventListener('input', function (e) {
      const t      = e.target;
      const action = t.dataset.action;
      const id     = parseInt(t.dataset.id);
      if (!action || !id) return;

      if (action === 'label') {
        updateCalc(id, { label: t.value });
      } else if (action === 'total') {
        updateCalc(id, { totalQuantity: parseNum(t.value) });
        updateResultLine(id);
        renderSummary();
      } else if (action === 'price') {
        updateCalc(id, { price: parseNum(t.value) });
        updateResultLine(id);
        renderSummary();
      } else if (action === 'sold') {
        state.soldAmounts[id] = parseNum(t.value);
        updateSoldBtn(id);
        updateResultLine(id);
        renderSummary();
      }
    });

    grid.addEventListener('click', function (e) {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const action   = t.dataset.action;
      const id       = parseInt(t.dataset.id);

      if (action === 'remove') {
        removeCalculator(id);
      } else if (action === 'mark-sold') {
        markAsSold(id);
      } else if (action === 'currency') {
        const currency = t.dataset.currency;
        updateCalc(id, { currencyType: currency });
        const card = grid.querySelector(`.calc-card[data-id="${id}"]`);
        if (card) card.querySelectorAll('.currency-option').forEach(opt =>
          opt.classList.toggle('selected', opt.dataset.currency === currency));
        updateResultLine(id);
        renderSummary();
      }
    });
  }

  // ── DOM helpers ────────────────────────────────────────
  function parseNum(val) {
    const n = parseFloat((val || '').replace(',', '.'));
    return isNaN(n) ? 0 : Math.max(0, n);
  }

  function updateResultLine(id) {
    const calc = state.working.calculators.find(c => c.id === id);
    const card = document.querySelector(`.calc-card[data-id="${id}"]`);
    if (!calc || !card) return;
    const sold   = state.soldAmounts[id] || 0;
    const result = sold * calc.price;
    const line   = card.querySelector('.calc-result-line');
    if (line) line.innerHTML = `
      <span>${sold}</span>
      <span style="color:var(--text-dim)">×</span>
      <span>${calc.price || 0}</span>
      <span style="color:var(--text-dim)">=</span>
      <span class="result-num">${result.toFixed(2)}</span>
      ${currencyImg(calc.currencyType)}`;
  }

  function updateSoldBtn(id) {
    const sold = state.soldAmounts[id] || 0;
    const btn  = document.querySelector(`.calc-card[data-id="${id}"] [data-action="mark-sold"]`);
    if (btn) btn.disabled = sold <= 0;
  }

  // ── Modal ──────────────────────────────────────────────
  function openRequestModal() {
    const w     = state.working;
    const items = w.calculators
      .filter(c => c.totalQuantity > 0)
      .map(c => `x${c.totalQuantity} ${c.label || 'Calculator_' + c.id} - ${c.price}${c.currencyType === 'д' ? ':divine:' : ':chaos:'}/ea`);
    document.getElementById('modal-header').value    = w.requestHeader || '';
    document.getElementById('modal-footer').value    = w.requestFooter || '';
    document.getElementById('modal-body-text').value = items.length ? items.join('\n') : 'No items for sale (all quantities = 0)';
    document.getElementById('requestModal').style.display = 'flex';
  }

  function closeRequestModal() {
    document.getElementById('requestModal').style.display = 'none';
  }

  function closeModal(e) {
    if (e.target === document.getElementById('requestModal')) closeRequestModal();
  }

  function copyFullRequest() {
    const header = document.getElementById('modal-header').value.trim();
    const body   = document.getElementById('modal-body-text').value;
    const footer = document.getElementById('modal-footer').value.trim();
    const text   = [header, body, footer].filter(Boolean).join('\n\n');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => alert('Copied!'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); alert('Copied!'); } catch { alert('Copy manually:\n' + text); }
      document.body.removeChild(ta);
    }
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ───────────────────────────────────────────────
  loadFromStorage();
  render();

  return { openRequestModal, closeRequestModal, closeModal, copyFullRequest, updateHeader, updateFooter };
})();
