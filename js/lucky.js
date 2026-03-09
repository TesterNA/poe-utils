/* Lucky Percentage Calculator */
const luckyCalc = (function () {
  function switchTab(tab) {
    document.getElementById('lucky-normal-tab').style.display  = tab === 'normal'  ? 'block' : 'none';
    document.getElementById('lucky-reverse-tab').style.display = tab === 'reverse' ? 'block' : 'none';
    clearResult('result1');
    clearResult('result2');
  }

  function clearResult(id) {
    const el = document.getElementById('lucky-' + id);
    if (el) { el.classList.remove('show', 'error'); el.textContent = ''; }
  }

  function showResult(id, html, isError) {
    const el = document.getElementById('lucky-' + id);
    el.innerHTML = html;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
  }

  function calcLucky() {
    const val = parseFloat(document.getElementById('lucky-initialPct').value);
    if (isNaN(val) || val < 0 || val > 100) {
      showResult('result1', 'Please enter a valid percentage (0 – 100)', true);
      return;
    }
    const lucky = (1 - Math.pow(1 - val / 100, 2)) * 100;
    showResult('result1', 'Lucky Percentage: <strong>' + lucky.toFixed(2) + '%</strong>');
  }

  function calcRequired() {
    const val = parseFloat(document.getElementById('lucky-luckyPct').value);
    if (isNaN(val) || val < 0 || val > 100) {
      showResult('result2', 'Please enter a valid percentage (0 – 100)', true);
      return;
    }
    const initial = (1 - Math.sqrt(1 - val / 100)) * 100;
    showResult('result2', 'Required Initial: <strong>' + initial.toFixed(2) + '%</strong>');
  }

  // Enter key support
  document.getElementById('lucky-initialPct').addEventListener('keypress', e => { if (e.key === 'Enter') calcLucky(); });
  document.getElementById('lucky-luckyPct').addEventListener('keypress',   e => { if (e.key === 'Enter') calcRequired(); });

  return { switchTab, clearResult, calcLucky, calcRequired };
})();
