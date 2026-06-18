/* EXP Penalty Calculator — Path of Exile 1 & 2
   Formulas from the PoE / PoE 2 community wikis.
     SafeZone           = floor(3 + level/16)                       (both games)
     EffectiveDifference = max(|level - effMonsterLevel| - SafeZone, 0)
     XPMultiplier       = max( ((level+5)/(level+5 + diff^2.5))^E, 0.01 )
                          E = 1.5 (PoE 1)  ·  E = 1.3 (PoE 2)
   PoE 1 only: areas with monster level > 70 are treated as a lower level for
   XP purposes:  effML = -0.03*ml^2 + 5.17*ml - 144.9  (caps near 77.7). */
const expCalc = (function () {
  function safeZone(level) {
    return Math.floor(3 + level / 16);
  }

  function effectiveMonsterLevel(monsterLevel, game) {
    if (game === 'poe1' && monsterLevel > 70) {
      const eff = -0.03 * monsterLevel * monsterLevel + 5.17 * monsterLevel - 144.9;
      return Math.min(monsterLevel, eff);
    }
    return monsterLevel;
  }

  // Map tier for an area level (T1–T16). Differs by game:
  //   PoE 1: T1 = area level 68 … T16 = 83
  //   PoE 2: T1 = area level 65 … T16 = 80
  // Returns null outside that range (no tier shown above/below).
  function mapTier(areaLevel, game) {
    const t = areaLevel - (game === 'poe2' ? 64 : 67);
    return (t >= 1 && t <= 16) ? t : null;
  }

  function compute(level, monsterLevel, game) {
    const effML  = effectiveMonsterLevel(monsterLevel, game);
    const safe   = safeZone(level);
    const effDiff = Math.max(Math.abs(level - effML) - safe, 0);
    const outer  = game === 'poe2' ? 1.3 : 1.5;
    const base   = level + 5;
    const raw    = Math.pow(base / (base + Math.pow(effDiff, 2.5)), outer);
    return { effML, safe, effDiff, mult: Math.max(raw, 0.01) };
  }

  function category(mult) {
    if (mult >= 0.9999) return { key: 'full',   label: 'Full XP — No Penalty' };
    if (mult >= 0.90)   return { key: 'min',    label: 'Minimal Penalty' };
    if (mult >= 0.50)   return { key: 'mod',    label: 'Moderate Penalty' };
    if (mult >= 0.10)   return { key: 'heavy',  label: 'Heavy Penalty' };
    return { key: 'severe', label: 'Severe Penalty' };
  }

  function fmtPct(mult) {
    const pct = mult * 100;
    return Math.abs(pct - Math.round(pct)) < 0.05 ? Math.round(pct) + '%' : pct.toFixed(1) + '%';
  }

  function trimNum(n) {
    return n.toFixed(2).replace(/\.?0+$/, '');
  }

  // Contiguous span of area levels that grant full XP, plus the single best area
  // level (highest multiplier) — used as a fallback when no full-XP band exists,
  // e.g. high-level PoE 1 chars capped out by the level-70 area reduction.
  function fullXpRange(level, game) {
    let lo = null, hi = null, best = 1, bestMult = -1;
    for (let z = 1; z <= 100; z++) {
      if (Math.abs(level - effectiveMonsterLevel(z, game)) - safeZone(level) <= 0) {
        if (lo === null) lo = z;
        hi = z;
      }
      const m = compute(level, z, game).mult;
      if (m > bestMult) { bestMult = m; best = z; }
    }
    return { lo, hi, best, bestMult };
  }

  function buildTable(level, currentZone, game, band) {
    // Span the range so it covers the character, the entered zone AND the
    // full-XP band — so the dropoff between them is always visible.
    const hiAnchor = band.lo !== null ? band.hi : band.best;
    const loAnchor = band.lo !== null ? band.lo : band.best;
    let top = Math.min(100, Math.max(level + 4, currentZone + 3, hiAnchor + 2));
    let bottom = Math.max(1, Math.min(level - 6, currentZone - 3, loAnchor - 2));
    // Guard against absurd spans (e.g. level 1 vs zone 100) — keep it readable.
    if (top - bottom > 48) {
      top = Math.min(100, currentZone + 24);
      bottom = Math.max(1, top - 48);
    }
    let rows = '';
    for (let z = top; z >= bottom; z--) {
      const r = compute(level, z, game);
      const cat = category(r.mult);
      const pct = r.mult * 100;
      const delta = z - level;
      const tier = mapTier(z, game);
      rows +=
        '<tr class="exp-row xp-' + cat.key + (z === currentZone ? ' exp-row-current' : '') + '">' +
          '<td>' + z + (tier ? ' <span class="exp-tier">T' + tier + '</span>' : '') + '</td>' +
          '<td>' + (delta > 0 ? '+' : '') + delta + '</td>' +
          '<td><div class="exp-bar-wrap"><div class="exp-bar" style="width:' + pct.toFixed(1) + '%"></div></div></td>' +
          '<td class="exp-pct">' + fmtPct(r.mult) + '</td>' +
        '</tr>';
    }
    return rows;
  }

  function clampInt(v, min, max, fallback) {
    let n = parseInt(v, 10);
    if (isNaN(n)) n = fallback;
    return Math.min(max, Math.max(min, n));
  }

  function pop(el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'countPop 0.15s ease';
  }

  function calculate() {
    const game  = document.querySelector('input[name="exp-game"]:checked').value;
    const level = clampInt(document.getElementById('exp-level').value, 1, 100, 90);
    const zone  = clampInt(document.getElementById('exp-zone').value, 1, 100, 83);

    const r = compute(level, zone, game);
    const cat = category(r.mult);

    const valEl = document.getElementById('exp-result');
    valEl.textContent = fmtPct(r.mult);
    valEl.className = 'result-value xp-text-' + cat.key;
    pop(valEl);

    const statusEl = document.getElementById('exp-status');
    statusEl.textContent = cat.label;
    statusEl.className = 'exp-status xp-' + cat.key;

    const diff = zone - level;
    document.getElementById('exp-safezone').textContent = '±' + r.safe;
    document.getElementById('exp-diff').textContent = (diff > 0 ? '+' : '') + diff;
    document.getElementById('exp-effdiff').textContent = trimNum(r.effDiff);

    const showEff = game === 'poe1' && zone > 70;
    document.getElementById('exp-effml-item').style.display = showEff ? '' : 'none';
    if (showEff) document.getElementById('exp-effml').textContent = r.effML.toFixed(1);

    const band = fullXpRange(level, game);
    const bandLine = document.getElementById('exp-band-line');
    const bandLabel = document.getElementById('exp-band-label');
    const bandValue = document.getElementById('exp-band');
    if (band.lo !== null) {
      bandLabel.textContent = 'Full XP at area levels:';
      bandValue.textContent = band.lo === band.hi ? String(band.lo) : band.lo + ' – ' + band.hi;
      bandLine.classList.remove('exp-band-line-warn');
    } else {
      // No penalty-free area exists — show the best obtainable instead.
      bandLabel.textContent = 'No full-XP area · best is:';
      bandValue.textContent = 'level ' + band.best + ' (' + fmtPct(band.bestMult) + ')';
      bandLine.classList.add('exp-band-line-warn');
    }

    document.getElementById('exp-table-lvl').textContent = level;
    document.getElementById('exp-tbody').innerHTML = buildTable(level, zone, game, band);

    // Scroll the table so the entered zone sits in view (ramp visible below it).
    const wrap = document.querySelector('.exp-table-wrap');
    const cur = document.querySelector('.exp-row-current');
    if (wrap && cur && wrap.offsetParent !== null) {
      const wrapRect = wrap.getBoundingClientRect();
      const curRect = cur.getBoundingClientRect();
      wrap.scrollTop += (curRect.top - wrapRect.top) - wrap.clientHeight / 3;
    }

    document.getElementById('exp-note-poe1').style.display = game === 'poe1' ? '' : 'none';
    document.getElementById('exp-note-95').style.display =
      (game === 'poe1' && level >= 95) ? 'block' : 'none';
  }

  // Re-run on tab open so the auto-scroll positions correctly (initial run
  // happens while the view is hidden, where measurements are unavailable).
  const navBtn = document.querySelector('.nav-btn[data-tool="exp"]');
  if (navBtn) navBtn.addEventListener('click', function () { setTimeout(calculate, 0); });

  calculate();
  return { calculate };
})();
