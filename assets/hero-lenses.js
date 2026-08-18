/* ==========================================================================
   Katxel homepage — "Lenses" hero canvas
   One canvas, four visual states (geo / ops / risk / learn) that crossfade
   into each other. Auto-cycles on load so a passive visitor sees them all,
   then locks to whichever division the visitor hovers or selects.
   Exposes window.KatxelLenses = { set, stopCycle }.
   ========================================================================== */
(function () {
  'use strict';

  var cv = document.getElementById('heroCanvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var RGB = { geo: '0,194,168', ops: '99,102,241', risk: '255,122,0', learn: '34,197,94' };
  var ORDER = ['geo', 'ops', 'risk', 'learn'];
  var WHITE = '255,255,255';

  var W = 0, H = 0, DPR = 1, raf = null, visible = true, ready = false;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // Resizing clears the backing store; repaint now rather than waiting for a
    // frame that may never come while the tab is hidden or throttled.
    if (ready) render(performance.now());
  }
  resize();
  window.addEventListener('resize', resize);
  // The first measurement can land before fonts and stylesheets settle, which
  // leaves the backing store the wrong size. Track the element's real box.
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv);
  window.addEventListener('load', resize);

  /* ---------- state / crossfade ----------
     Division pages reuse this file for their hero: no #lensRail means no
     cycling, and the canvas simply locks to that page's body[data-vertical].
  ------------------------------------------ */
  var INITIAL = RGB[document.body.dataset.vertical] ? document.body.dataset.vertical : 'geo';
  var from = INITIAL, to = INITIAL, mix = 1, mixStart = 0, MIX_MS = 700;

  function setLens(key) {
    if (!RGB[key] || key === to) return;
    from = to; to = key; mix = 0; mixStart = performance.now();
  }

  function rgbMix(t) {
    if (mix >= 1) return RGB[to];
    var a = RGB[from].split(',').map(Number), b = RGB[to].split(',').map(Number);
    return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',');
  }

  /* ---------- shared background ---------- */
  var blobs = [
    { x: .28, y: .42, r: .40, sp: .06, a: .11 },
    { x: .66, y: .38, r: .42, sp: .05, a: .12 },
    { x: .86, y: .64, r: .36, sp: .05, a: .09 },
    { x: .48, y: .82, r: .40, sp: .07, a: .08 }
  ];

  function drawBlobs(t, rgb) {
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var cx = (b.x + Math.sin(t * b.sp + i) * 0.03) * W;
      var cy = (b.y + Math.cos(t * b.sp * 1.2 + i) * 0.03) * H;
      var rr = b.r * Math.min(W, H) * (0.9 + 0.1 * Math.sin(t * 0.5 + i));
      var a = b.a * (0.7 + 0.3 * Math.sin(t * 0.6 + i));
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  function drawContours(t, rgb) {
    for (var i = 0; i < 9; i++) {
      var baseY = H * (0.12 + i * 0.095), amp = 10 + i * 2.2;
      ctx.beginPath();
      for (var x = -20; x <= W + 20; x += 14) {
        var y = baseY + Math.sin(x * 0.006 + t * 0.5 + i * 0.6) * amp + Math.sin(x * 0.013 - t * 0.3 + i) * amp * 0.4;
        x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      var a = 0.07 + 0.04 * Math.sin(t * 0.4 + i);
      ctx.strokeStyle = 'rgba(' + (i % 3 === 0 ? rgb : WHITE) + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 1; ctx.stroke();
    }
  }

  /* ---------- lens: GEO — survey mesh over terrain ---------- */
  var geoPts = [
    { x: .17, y: .34 }, { x: .30, y: .58 }, { x: .44, y: .30 },
    { x: .58, y: .52 }, { x: .71, y: .33 }, { x: .84, y: .58 }, { x: .92, y: .40 }
  ];

  function drawGeo(t, rgb, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;

    // perspective terrain mesh across the lower half
    var rows = 11, cols = 22;
    for (var r = 0; r < rows; r++) {
      var rt = r / (rows - 1);
      var yBase = H * (0.42 + rt * 0.62);
      var inset = (1 - rt) * W * 0.16;
      ctx.beginPath();
      for (var c = 0; c <= cols; c++) {
        var ct = c / cols;
        var x = inset + ct * (W - inset * 2);
        var h = Math.sin(ct * 7 + t * 0.35 + r * 0.5) * 9 * (0.4 + rt)
              + Math.sin(ct * 3.1 - t * 0.22 + r) * 14 * (0.3 + rt * 0.7);
        var y = yBase - h;
        c === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.05 + rt * 0.16).toFixed(3) + ')';
      ctx.lineWidth = 1; ctx.stroke();
    }
    // vertical mesh ties
    for (var c2 = 0; c2 <= cols; c2 += 2) {
      ctx.beginPath();
      for (var r2 = 0; r2 < rows; r2++) {
        var rt2 = r2 / (rows - 1), ct2 = c2 / cols;
        var inset2 = (1 - rt2) * W * 0.16;
        var x2 = inset2 + ct2 * (W - inset2 * 2);
        var h2 = Math.sin(ct2 * 7 + t * 0.35 + r2 * 0.5) * 9 * (0.4 + rt2)
               + Math.sin(ct2 * 3.1 - t * 0.22 + r2) * 14 * (0.3 + rt2 * 0.7);
        var y2 = H * (0.42 + rt2 * 0.62) - h2;
        r2 === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = 'rgba(' + rgb + ',.07)';
      ctx.lineWidth = 1; ctx.stroke();
    }

    // triangulation between survey points
    ctx.beginPath();
    for (var i = 0; i < geoPts.length - 1; i++) {
      var p = geoPts[i], q = geoPts[i + 1];
      ctx.moveTo(p.x * W, p.y * H); ctx.lineTo(q.x * W, q.y * H);
      if (i < geoPts.length - 2) {
        var s = geoPts[i + 2];
        ctx.moveTo(p.x * W, p.y * H); ctx.lineTo(s.x * W, s.y * H);
      }
    }
    ctx.strokeStyle = 'rgba(' + rgb + ',.20)';
    ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);

    // survey markers — crosshair that "acquires" on a cycle
    for (var j = 0; j < geoPts.length; j++) {
      var g = geoPts[j], gx = g.x * W, gy = g.y * H;
      var lock = (Math.sin(t * 1.1 + j * 1.7) + 1) / 2;      // 0..1
      var ring = 16 - lock * 7;
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.25 + lock * 0.5).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(gx, gy, ring, 0, 6.2832); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx - ring - 5, gy); ctx.lineTo(gx - ring + 3, gy);
      ctx.moveTo(gx + ring - 3, gy); ctx.lineTo(gx + ring + 5, gy);
      ctx.moveTo(gx, gy - ring - 5); ctx.lineTo(gx, gy - ring + 3);
      ctx.moveTo(gx, gy + ring - 3); ctx.lineTo(gx, gy + ring + 5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(' + rgb + ',' + (0.5 + lock * 0.45).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(gx, gy, 2.6, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- lens: OPS — schedule lattice ---------- */
  var bars = [
    { row: 0, s: .06, w: .20, sp: .9 }, { row: 1, s: .22, w: .17, sp: 1.2 },
    { row: 2, s: .34, w: .24, sp: .8 }, { row: 3, s: .52, w: .15, sp: 1.4 },
    { row: 4, s: .44, w: .28, sp: 1.0 }, { row: 5, s: .66, w: .19, sp: 1.1 },
    { row: 6, s: .58, w: .22, sp: .95 }, { row: 7, s: .74, w: .18, sp: 1.3 }
  ];

  function drawOps(t, rgb, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;

    var top = H * 0.20, gap = (H * 0.62) / bars.length;

    // faint week gridlines
    for (var g = 0; g <= 10; g++) {
      var gx = W * (0.04 + g * 0.092);
      ctx.beginPath(); ctx.moveTo(gx, top - 18); ctx.lineTo(gx, top + gap * bars.length);
      ctx.strokeStyle = 'rgba(' + WHITE + ',.05)'; ctx.lineWidth = 1; ctx.stroke();
    }

    var ends = [];
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var y = top + b.row * gap;
      var grow = 0.55 + 0.45 * ((Math.sin(t * 0.55 * b.sp + i * 1.3) + 1) / 2);
      var x0 = b.s * W, w = b.w * W * grow, h = Math.max(7, gap * 0.34);

      // track
      ctx.fillStyle = 'rgba(' + WHITE + ',.045)';
      roundRect(x0, y, b.w * W, h, h / 2); ctx.fill();
      // bar
      var lg = ctx.createLinearGradient(x0, 0, x0 + w, 0);
      lg.addColorStop(0, 'rgba(' + rgb + ',.75)');
      lg.addColorStop(1, 'rgba(' + rgb + ',.30)');
      ctx.fillStyle = lg;
      roundRect(x0, y, w, h, h / 2); ctx.fill();

      ends.push({ x: x0 + w, y: y + h / 2, sx: x0, i: i });
    }

    // dependency elbows between consecutive tasks
    ctx.strokeStyle = 'rgba(' + rgb + ',.28)';
    ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
    for (var k = 0; k < ends.length - 1; k++) {
      var a = ends[k], n = ends[k + 1];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + 10, a.y);
      ctx.lineTo(a.x + 10, n.y);
      ctx.lineTo(n.sx, n.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // milestone diamonds
    for (var m = 0; m < ends.length; m += 3) {
      var e = ends[m];
      var pulse = 0.55 + 0.45 * Math.sin(t * 2 + m);
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgba(' + rgb + ',' + (0.4 + pulse * 0.5).toFixed(3) + ')';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, h / 2, Math.abs(w) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- lens: RISK — epicentre ripples ---------- */
  var eps = [
    { x: .14, y: .30, ph: 1.1, per: 3.6 }, { x: .26, y: .66, ph: 2.2, per: 4.1 },
    { x: .38, y: .40, ph: 0.4, per: 3.4 }, { x: .50, y: .74, ph: 2.5, per: 3.8 },
    { x: .60, y: .30, ph: 0.0, per: 3.9 }, { x: .72, y: .60, ph: 1.3, per: 4.2 },
    { x: .84, y: .34, ph: 3.1, per: 3.2 }, { x: .92, y: .72, ph: 0.7, per: 4.6 }
  ];

  function drawRisk(t, rgb, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    for (var i = 0; i < eps.length; i++) {
      var e = eps[i], cx = e.x * W, cy = e.y * H, maxR = Math.min(W, H) * 0.55;
      for (var k = 0; k < 3; k++) {
        var prog = ((t / e.per) + e.ph + k / 3) % 1;
        ctx.beginPath(); ctx.arc(cx, cy, prog * maxR, 0, 6.2832);
        ctx.strokeStyle = 'rgba(' + rgb + ',' + ((1 - prog) * 0.55).toFixed(3) + ')';
        ctx.lineWidth = 1.9; ctx.stroke();
      }
      var pulse = 0.5 + 0.5 * Math.sin(t * 3 + e.ph), cr = 10 + 6 * pulse;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      g.addColorStop(0, 'rgba(' + rgb + ',0.8)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(' + rgb + ',0.95)';
      ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- lens: LEARN — curriculum tracks filling up ---------- */
  var tracks = [
    { y: .28, n: 6, ph: 0.0, sp: .30 },
    { y: .50, n: 8, ph: 1.4, sp: .24 },
    { y: .72, n: 5, ph: 2.6, sp: .34 }
  ];

  function drawLearn(t, rgb, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;

    for (var r = 0; r < tracks.length; r++) {
      var tr = tracks[r], y = tr.y * H;
      var x0 = W * 0.08, x1 = W * 0.92, span = x1 - x0;
      var prog = ((Math.sin(t * tr.sp + tr.ph) + 1) / 2);   // 0..1 sweep
      var done = prog * (tr.n - 1);

      // the track line: dim ahead, bright behind the sweep
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y);
      ctx.strokeStyle = 'rgba(' + rgb + ',.10)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + span * prog, y);
      ctx.strokeStyle = 'rgba(' + rgb + ',.42)'; ctx.lineWidth = 2; ctx.stroke();

      for (var i = 0; i < tr.n; i++) {
        var nx = x0 + (span / (tr.n - 1)) * i;
        var complete = i < Math.floor(done);
        var current = i === Math.floor(done);

        if (complete) {
          ctx.fillStyle = 'rgba(' + rgb + ',.55)';
          ctx.beginPath(); ctx.arc(nx, y, 5, 0, 6.2832); ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(' + rgb + ',.28)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(nx, y, 5, 0, 6.2832); ctx.stroke();
        }

        // the module currently in progress carries a sweeping ring
        if (current) {
          var frac = done - Math.floor(done);
          ctx.strokeStyle = 'rgba(' + rgb + ',.85)'; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.arc(nx, y, 11, -1.5708, -1.5708 + frac * 6.2832); ctx.stroke();
          ctx.fillStyle = 'rgba(' + rgb + ',.9)';
          ctx.beginPath(); ctx.arc(nx, y, 3.2, 0, 6.2832); ctx.fill();
        }
      }

      // links down to the next track, suggesting a progression between levels
      if (r < tracks.length - 1) {
        var nyt = tracks[r + 1].y * H;
        var lx = x0 + span * (0.22 + r * 0.3);
        ctx.beginPath();
        ctx.moveTo(lx, y + 6);
        ctx.bezierCurveTo(lx, y + (nyt - y) * .5, lx + 46, y + (nyt - y) * .5, lx + 46, nyt - 6);
        ctx.strokeStyle = 'rgba(' + rgb + ',.20)'; ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  var DRAW = { geo: drawGeo, ops: drawOps, risk: drawRisk, learn: drawLearn };

  /* ---------- frame loop ---------- */
  var t0 = performance.now();

  function render(now) {
    var t = (now - t0) / 1000;
    if (mix < 1) mix = Math.min((now - mixStart) / MIX_MS, 1);
    var e = mix < 1 ? (1 - Math.pow(1 - mix, 3)) : 1;   // ease-out cubic
    var rgb = rgbMix(e);

    ctx.clearRect(0, 0, W, H);
    drawBlobs(t, rgb);
    drawContours(t, rgb);
    if (e < 1 && from !== to) DRAW[from](t, rgb, 1 - e);
    DRAW[to](t, rgb, e);
  }

  function frame(now) {
    render(now);
    raf = reduce ? null : requestAnimationFrame(frame);
  }

  function start() { if (!raf && !reduce) { raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  /* ---------- lens rail wiring ---------- */
  var rail = document.getElementById('lensRail');
  var lensEls = rail ? Array.prototype.slice.call(rail.querySelectorAll('.lens')) : [];
  var copy = {
    geo: {
      h: 'Precision <span class="hl">geospatial data</span>, ground to insight',
      s: 'Survey, capture, and processing that turns terrain into decision-ready layers — for planners, utilities, and infrastructure owners.',
      title: 'Katxel Geo', tag: 'GEOSPATIAL',
      cells: [
        ['Survey accuracy', '5 cm'],
        ['Capture GSD', '2 – 5 cm'],
        ['Delivered as', 'GeoPackage · PostGIS'],
        ['Scale', 'Site → district']
      ],
      bars: [34, 58, 46, 72, 63, 88, 70, 52],
      foot: 'Field capture → processing → finished layer'
    },
    ops: {
      h: 'Business software that <span class="hl">fits how you work</span>',
      s: 'HRMS, project planning, and internal tools built around your process instead of forcing your team into someone else’s.',
      title: 'Katxel Ops', tag: 'SOFTWARE',
      cells: [
        ['First pilot', '~6 weeks'],
        ['Licence fees', 'None'],
        ['Source code', 'Handed to you'],
        ['Runs on', 'Your cloud or ours']
      ],
      bars: [22, 38, 51, 60, 74, 81, 90, 96],
      foot: 'Shadow → pilot → roll out → handover'
    },
    risk: {
      h: 'Catastrophe data into <span class="hl">actionable risk intelligence</span>',
      s: 'Flood, earthquake, cyclone, and climate modelling for insurers, reinsurers, governments, and infrastructure owners.',
      title: 'Katxel Risk', tag: 'RISK',
      cells: [
        ['Return periods', '2 – 1,500 yr'],
        ['Output grid', '10 – 30 m'],
        ['Perils modelled', '6'],
        ['Max modelled depth', '7 m']
      ],
      bars: [92, 64, 78, 41, 86, 55, 70, 33],
      foot: 'Hazard → vulnerability → portfolio loss'
    },
    learn: {
      h: 'Training that ends in <span class="hl">work you can show</span>',
      s: 'GIS and IT training built on live projects, mentor-reviewed work, and an internship certificate — practical skills rather than slideware.',
      title: 'Katxel Learn', tag: 'TRAINING',
      cells: [
        ['Training tracks', '4'],
        ['Cohort length', '8 weeks'],
        ['Live projects', '3 per track'],
        ['On completion', 'Internship certificate']
      ],
      bars: [18, 29, 38, 50, 61, 73, 84, 95],
      foot: 'Learn → build → review → certify'
    }
  };
  var h1 = document.getElementById('lensH1');
  var sub = document.getElementById('lensSub');
  var panel = document.getElementById('lensPanel');
  // NB: not `bars` — that name belongs to the Ops lens artwork above.
  var panelBars = document.getElementById('lpBars');
  if (panelBars && !panelBars.children.length) {
    for (var b = 0; b < 8; b++) panelBars.appendChild(document.createElement('i'));
  }

  function paintPanel(key) {
    if (!panel) return;
    var c = copy[key], set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set('lpTitle', c.title); set('lpTag', c.tag); set('lpFoot', c.foot);
    for (var i = 0; i < c.cells.length; i++) {
      set('lpK' + (i + 1), c.cells[i][0]);
      set('lpV' + (i + 1), c.cells[i][1]);
    }
    if (panelBars) {
      for (var j = 0; j < panelBars.children.length; j++) {
        panelBars.children[j].style.height = (c.bars[j] || 40) + '%';
      }
    }
  }
  paintPanel(INITIAL);
  var cycling = true, cycleTimer = null, idx = 0, booted = false;

  function paintCopy(key) {
    if (!h1 || !sub) return;
    h1.classList.add('out'); sub.classList.add('out');
    if (panel) panel.classList.add('out');
    setTimeout(function () {
      h1.innerHTML = copy[key].h;
      sub.textContent = copy[key].s;
      paintPanel(key);
      h1.classList.remove('out'); sub.classList.remove('out');
      if (panel) panel.classList.remove('out');
    }, reduce ? 0 : 320);
  }

  function select(key, userDriven) {
    if (userDriven) stopCycle();
    setLens(key);
    if (booted) paintCopy(key);   // markup already carries the initial copy
    document.body.dataset.vertical = key;
    lensEls.forEach(function (el) {
      var on = el.dataset.lens === key;
      el.dataset.active = on ? 'true' : 'false';
      el.dataset.cycling = (on && cycling) ? 'true' : 'false';
      // restart the CSS progress bar
      if (on && cycling) { var tick = el.querySelector('.tick'); if (tick) { tick.style.animation = 'none'; void tick.offsetWidth; tick.style.animation = ''; } }
    });
  }

  function stopCycle() {
    cycling = false;
    if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; }
    lensEls.forEach(function (el) { el.dataset.cycling = 'false'; });
  }

  lensEls.forEach(function (el) {
    var key = el.dataset.lens;
    el.addEventListener('mouseenter', function () { select(key, true); });
    el.addEventListener('focus', function () { select(key, true); });
    el.addEventListener('click', function (e) {
      // first tap on touch previews the lens; the link then carries them through
      if (el.dataset.active !== 'true' && window.matchMedia('(hover:none)').matches) {
        e.preventDefault(); select(key, true);
      }
    });
  });

  idx = ORDER.indexOf(INITIAL);
  select(INITIAL, false);
  booted = true;
  if (!reduce && lensEls.length) {
    cycleTimer = setInterval(function () {
      idx = (idx + 1) % ORDER.length;
      select(ORDER[idx], false);
    }, 4200);
  }

  /* ---------- only animate while the hero is on screen ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible && !document.hidden ? start() : stop();
    }, { threshold: 0 }).observe(cv);
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden || !visible ? stop() : start();
  });

  // Always paint one frame up front, so the hero is never blank while waiting
  // for the first rAF (background tab, throttled frames, reduced motion).
  if (reduce) t0 = performance.now() - 2000;
  ready = true;
  render(performance.now());
  if (!reduce) start();

  window.KatxelLenses = { set: function (k) { select(k, true); }, stopCycle: stopCycle };
})();
