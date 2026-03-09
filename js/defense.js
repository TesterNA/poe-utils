/* Defense Calculator */
const defCalc = (function () {
  function getBase() {
    const mode = document.querySelector('input[name="def-mode"]:checked').value;
    if (mode === 'base') return Number(document.getElementById('def-base').value) || 0;
    const min = Number(document.getElementById('def-rangeMin').value) || 0;
    const max = Number(document.getElementById('def-rangeMax').value) || 0;
    const pct = (Number(document.getElementById('def-rangePercent').value) || 0) / 100;
    return min + (max - min) * pct;
  }

  function calculate() {
    const mode = document.querySelector('input[name="def-mode"]:checked').value;
    document.getElementById('def-baseInput').style.display  = mode === 'base'    ? 'block' : 'none';
    document.getElementById('def-rangeInputs').style.display = mode === 'percent' ? 'block' : 'none';

    const base    = getBase();
    const flat    = Number(document.getElementById('def-flat').value)    || 0;
    const inc     = Number(document.getElementById('def-inc').value)     || 0;
    const quality = Number(document.getElementById('def-quality').value) || 0;

    const result = (base + flat) * (1 + inc / 100) * (1 + quality / 100);
    const el = document.getElementById('def-result');
    el.textContent = Math.round(result);
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'countPop 0.15s ease';
  }

  function syncSlider() {
    const pct = Number(document.getElementById('def-rangePercent').value) || 0;
    document.getElementById('def-slider').value = Math.min(100, Math.max(0, pct));
    document.getElementById('def-pctLabel').textContent = Math.round(pct);
    calculate();
  }

  function syncPercent() {
    const val = document.getElementById('def-slider').value;
    document.getElementById('def-rangePercent').value = val;
    document.getElementById('def-pctLabel').textContent = val;
    calculate();
  }

  // Init
  calculate();

  return { calculate, syncSlider, syncPercent };
})();
