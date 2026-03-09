/* Currency Exchange Calculator */
const exchangeCalc = (function () {
  let lastEdited = 'A';

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const t = b; b = a % b; a = t; }
    return a;
  }

  function getWholeNumberRatio(rA, rB) {
    const mul = 10000;
    let iA = Math.round(rA * mul);
    let iB = Math.round(rB * mul);
    const d = gcd(iA, iB);
    return { wA: iA / d, wB: iB / d };
  }

  function calcFromA() {
    const rA = parseFloat(document.getElementById('ex-ratioA').value) || 1;
    const rB = parseFloat(document.getElementById('ex-ratioB').value) || 1;
    const amt = parseFloat(document.getElementById('ex-amountA').value) || 0;
    document.getElementById('ex-amountB').value = (amt * (rB / rA)).toFixed(2);
    updateOptimalA(amt, rA, rB);
  }

  function calcFromB() {
    const rA = parseFloat(document.getElementById('ex-ratioA').value) || 1;
    const rB = parseFloat(document.getElementById('ex-ratioB').value) || 1;
    const amt = parseFloat(document.getElementById('ex-amountB').value) || 0;
    document.getElementById('ex-amountA').value = (amt * (rA / rB)).toFixed(2);
    updateOptimalB(amt, rA, rB);
  }

  function updateOptimalA(inputA, rA, rB) {
    document.getElementById('ex-optimalInputLabel').textContent  = 'Optimal Currency A Amount';
    document.getElementById('ex-optimalResultLabel').textContent = 'You will receive exactly (Currency B)';
    if (inputA > 0) {
      const { wA, wB } = getWholeNumberRatio(rA, rB);
      const packs = Math.floor(inputA / wA);
      document.getElementById('ex-optimalInput').value  = packs > 0 ? packs * wA : 0;
      document.getElementById('ex-optimalResult').value = packs > 0 ? packs * wB : 0;
    } else {
      document.getElementById('ex-optimalInput').value  = 0;
      document.getElementById('ex-optimalResult').value = 0;
    }
  }

  function updateOptimalB(inputB, rA, rB) {
    document.getElementById('ex-optimalInputLabel').textContent  = 'Optimal Currency B Amount';
    document.getElementById('ex-optimalResultLabel').textContent = 'You will receive exactly (Currency A)';
    if (inputB > 0) {
      const { wA, wB } = getWholeNumberRatio(rA, rB);
      const packs = Math.floor(inputB / wB);
      document.getElementById('ex-optimalInput').value  = packs > 0 ? packs * wB : 0;
      document.getElementById('ex-optimalResult').value = packs > 0 ? packs * wA : 0;
    } else {
      document.getElementById('ex-optimalInput').value  = 0;
      document.getElementById('ex-optimalResult').value = 0;
    }
  }

  function onRatioChange() {
    lastEdited === 'A' ? calcFromA() : calcFromB();
  }

  // Bind
  document.getElementById('ex-ratioA').addEventListener('input', onRatioChange);
  document.getElementById('ex-ratioB').addEventListener('input', onRatioChange);
  document.getElementById('ex-amountA').addEventListener('input', () => { lastEdited = 'A'; calcFromA(); });
  document.getElementById('ex-amountB').addEventListener('input', () => { lastEdited = 'B'; calcFromB(); });

  calcFromA();
})();
