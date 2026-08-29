/* ==========================================================================
   Katxel homepage — Four Doors behaviour.
   Loaded only by index.html, after site.js (which handles the nav, the
   contact form and the footer year).
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================================================================
     DOORS — open on hover/focus, whole panel is a link target
     ====================================================================== */
  var doors = document.getElementById('doors');
  if (!doors) return;
  var doorEls = [].slice.call(doors.querySelectorAll('.door'));
  var wide = window.matchMedia('(min-width:901px)');

  function open(el) {
    if (!wide.matches) return;
    doorEls.forEach(function (d) { d.dataset.open = String(d === el); });
  }
  doorEls.forEach(function (d) {
    d.addEventListener('mouseenter', function () { open(d); });
    d.addEventListener('focusin',    function () { open(d); });
    // On touch the first tap opens the panel; the second follows the link.
    d.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      if (wide.matches || d.dataset.open === 'true') { window.location.href = d.dataset.href; }
      else { d.dataset.open = 'true'; }
    });
  });

  /* ======================================================================
     DOORS — one canvas behind the row. Each panel's box is measured every
     frame, so the artwork stretches with the flex transition for free.
     ====================================================================== */
  var dcv = document.getElementById('doorCanvas');
  var dctx = dcv.getContext('2d');
  var RGB = { geo: '0,194,168', ops: '99,102,241', risk: '255,122,0', learn: '34,197,94' };
  var DW = 0, DH = 0, DDPR = 1, draf = null, dvis = true, ready = false, lastNow = 0;

  function dsize() {
    DDPR = Math.min(window.devicePixelRatio || 1, 2);
    var r = doors.getBoundingClientRect();
    DW = Math.max(1, r.width); DH = Math.max(1, r.height);
    dcv.width = Math.round(DW * DDPR); dcv.height = Math.round(DH * DDPR);
    dctx.setTransform(DDPR, 0, 0, DDPR, 0, 0);
    // Resizing clears the backing store; repaint now rather than waiting for a
    // frame that may never come while the tab is hidden or throttled.
    if (ready) paintDoors(reduce ? dt0 + 2000 : (lastNow || dt0));
  }

  function band(el) {
    var a = doors.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height };
  }

  function rr(x, y, w, h, r) {
    r = Math.min(r, h / 2, Math.abs(w) / 2);
    dctx.beginPath();
    dctx.moveTo(x + r, y); dctx.lineTo(x + w - r, y); dctx.quadraticCurveTo(x + w, y, x + w, y + r);
    dctx.lineTo(x + w, y + h - r); dctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    dctx.lineTo(x + r, y + h); dctx.quadraticCurveTo(x, y + h, x, y + h - r);
    dctx.lineTo(x, y + r); dctx.quadraticCurveTo(x, y, x + r, y); dctx.closePath();
  }

  /* Geo — a contour field with survey crosshairs locking on */
  function geoBand(x, y, w, h, t, rgb, a) {
    var rows = 13, i;
    for (i = 0; i < rows; i++) {
      var yy = y + (h / (rows - 1)) * i;
      dctx.beginPath();
      for (var px = 0; px <= w + 8; px += 9) {
        var amp = 7 + (i % 4) * 3.5;
        var v = yy + Math.sin(px * 0.016 + t * 0.55 + i * 0.7) * amp
                   + Math.sin(px * 0.007 - t * 0.32 + i) * amp * 0.55;
        px === 0 ? dctx.moveTo(x + px, v) : dctx.lineTo(x + px, v);
      }
      dctx.strokeStyle = 'rgba(' + rgb + ',' + (a * (0.16 + 0.5 * (i / rows))).toFixed(3) + ')';
      dctx.lineWidth = 1; dctx.stroke();
    }
    var pts = [[.24, .24], [.66, .42], [.38, .66], [.76, .80]];
    for (var p = 0; p < pts.length; p++) {
      var cx = x + pts[p][0] * w, cy = y + pts[p][1] * h;
      var lock = (Math.sin(t * 1.05 + p * 1.9) + 1) / 2, ring = 15 - lock * 6;
      dctx.strokeStyle = 'rgba(' + rgb + ',' + (a * (0.35 + lock * 0.55)).toFixed(3) + ')';
      dctx.lineWidth = 1.3;
      dctx.beginPath(); dctx.arc(cx, cy, ring, 0, 6.2832); dctx.stroke();
      dctx.beginPath();
      dctx.moveTo(cx - ring - 5, cy); dctx.lineTo(cx - ring + 3, cy);
      dctx.moveTo(cx + ring - 3, cy); dctx.lineTo(cx + ring + 5, cy);
      dctx.moveTo(cx, cy - ring - 5); dctx.lineTo(cx, cy - ring + 3);
      dctx.moveTo(cx, cy + ring - 3); dctx.lineTo(cx, cy + ring + 5);
      dctx.stroke();
    }
  }

  /* Ops — a schedule lattice filling the panel */
  function opsBand(x, y, w, h, t, rgb, a) {
    var n = 11, gap = h / (n + 1);
    var starts = [.06, .22, .10, .34, .18, .46, .28, .12, .40, .24, .08];
    var widths = [.42, .34, .52, .28, .46, .30, .38, .50, .32, .44, .36];
    for (var i = 0; i < n; i++) {
      var yy = y + gap * (i + 1) - 4;
      var grow = 0.55 + 0.45 * ((Math.sin(t * 0.5 + i * 0.9) + 1) / 2);
      var bx = x + starts[i] * w, bw = widths[i] * w * grow, bh = Math.max(5, gap * 0.42);
      dctx.fillStyle = 'rgba(255,255,255,' + (a * 0.045).toFixed(3) + ')';
      rr(bx, yy, widths[i] * w, bh, bh / 2); dctx.fill();
      var g = dctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, 'rgba(' + rgb + ',' + (a * 0.72).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',' + (a * 0.24).toFixed(3) + ')');
      dctx.fillStyle = g; rr(bx, yy, bw, bh, bh / 2); dctx.fill();
      if (i % 3 === 0) {
        dctx.save(); dctx.translate(bx + bw, yy + bh / 2); dctx.rotate(Math.PI / 4);
        dctx.fillStyle = 'rgba(' + rgb + ',' + (a * 0.75).toFixed(3) + ')';
        dctx.fillRect(-3.4, -3.4, 6.8, 6.8); dctx.restore();
      }
    }
  }

  /* Risk — epicentres rippling across the panel */
  function riskBand(x, y, w, h, t, rgb, a) {
    var eps = [[.30, .26, 1.1, 3.4], [.72, .44, 2.3, 4.0], [.22, .68, 0.5, 3.7],
               [.66, .84, 2.8, 4.4], [.48, .14, 1.7, 3.1]];
    var maxR = Math.max(w, h) * 0.62;
    for (var i = 0; i < eps.length; i++) {
      var cx = x + eps[i][0] * w, cy = y + eps[i][1] * h, ph = eps[i][2], per = eps[i][3];
      for (var k = 0; k < 3; k++) {
        var pr = ((t / per) + ph + k / 3) % 1;
        dctx.beginPath(); dctx.arc(cx, cy, pr * maxR, 0, 6.2832);
        dctx.strokeStyle = 'rgba(' + rgb + ',' + (a * (1 - pr) * 0.55).toFixed(3) + ')';
        dctx.lineWidth = 1.8; dctx.stroke();
      }
      var pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + ph), cr = 8 + 5 * pulse;
      var g = dctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      g.addColorStop(0, 'rgba(' + rgb + ',' + (a * 0.85).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      dctx.fillStyle = g; dctx.beginPath(); dctx.arc(cx, cy, cr, 0, 6.2832); dctx.fill();
      dctx.fillStyle = 'rgba(' + rgb + ',' + (a * 0.95).toFixed(3) + ')';
      dctx.beginPath(); dctx.arc(cx, cy, 2.2, 0, 6.2832); dctx.fill();
    }
  }

  /* Learn — curriculum tracks filling module by module */
  function learnBand(x, y, w, h, t, rgb, a) {
    var rows = 7, pad = w * 0.10;
    for (var r = 0; r < rows; r++) {
      var yy = y + (h / (rows + 1)) * (r + 1);
      var x0 = x + pad, x1 = x + w - pad, span = x1 - x0;
      var prog = (Math.sin(t * 0.30 + r * 0.85) + 1) / 2;
      var nodes = 4 + (r % 3);
      dctx.beginPath(); dctx.moveTo(x0, yy); dctx.lineTo(x1, yy);
      dctx.strokeStyle = 'rgba(' + rgb + ',' + (a * 0.13).toFixed(3) + ')'; dctx.lineWidth = 2; dctx.stroke();
      dctx.beginPath(); dctx.moveTo(x0, yy); dctx.lineTo(x0 + span * prog, yy);
      dctx.strokeStyle = 'rgba(' + rgb + ',' + (a * 0.5).toFixed(3) + ')'; dctx.lineWidth = 2; dctx.stroke();
      var done = prog * (nodes - 1);
      for (var i = 0; i < nodes; i++) {
        var nx = x0 + (span / (nodes - 1)) * i;
        if (i < Math.floor(done)) {
          dctx.fillStyle = 'rgba(' + rgb + ',' + (a * 0.6).toFixed(3) + ')';
          dctx.beginPath(); dctx.arc(nx, yy, 4, 0, 6.2832); dctx.fill();
        } else {
          dctx.strokeStyle = 'rgba(' + rgb + ',' + (a * 0.32).toFixed(3) + ')'; dctx.lineWidth = 1.3;
          dctx.beginPath(); dctx.arc(nx, yy, 4, 0, 6.2832); dctx.stroke();
        }
        if (i === Math.floor(done)) {
          var frac = done - Math.floor(done);
          dctx.strokeStyle = 'rgba(' + rgb + ',' + (a * 0.9).toFixed(3) + ')'; dctx.lineWidth = 2;
          dctx.beginPath(); dctx.arc(nx, yy, 9, -1.5708, -1.5708 + frac * 6.2832); dctx.stroke();
        }
      }
    }
  }

  var PAINT = { geo: geoBand, ops: opsBand, risk: riskBand, learn: learnBand };
  var dt0 = performance.now();

  function paintDoors(now) {
    lastNow = now;
    var t = (now - dt0) / 1000;
    dctx.clearRect(0, 0, DW, DH);
    doorEls.forEach(function (d) {
      var b = band(d), k = d.dataset.k;
      var a = (d.dataset.open === 'true') ? 0.95 : 0.42;
      dctx.save();
      dctx.beginPath(); dctx.rect(b.x, b.y, b.w, b.h); dctx.clip();
      PAINT[k](b.x, b.y, b.w, b.h, t, RGB[k], a);
      dctx.restore();
    });
  }
  function dframe(now) { paintDoors(now); draf = requestAnimationFrame(dframe); }

  dsize();
  if ('ResizeObserver' in window) new ResizeObserver(dsize).observe(doors);
  window.addEventListener('resize', dsize);
  window.addEventListener('load', dsize);

  // Always paint one frame up front, so the doors are never blank while
  // waiting for the first rAF (background tab, throttled frames).
  ready = true;
  paintDoors(reduce ? dt0 + 2000 : dt0);

  if (!reduce) {
    draf = requestAnimationFrame(dframe);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        dvis = en[0].isIntersecting;
        if (dvis && !draf && !document.hidden) { draf = requestAnimationFrame(dframe); }
        else if (!dvis && draf) { cancelAnimationFrame(draf); draf = null; }
      }, { threshold: 0 }).observe(doors);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && draf) { cancelAnimationFrame(draf); draf = null; }
      else if (!document.hidden && dvis && !draf) { draf = requestAnimationFrame(dframe); }
    });
  }

  /* ======================================================================
     Reveal + counters
     ====================================================================== */
  var rv = document.querySelectorAll('.hrv, .hpillar');
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .16 });
    rv.forEach(function (el) { io.observe(el); });
    // never let reveal-on-scroll be the reason content stays invisible
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (!document.querySelector('.hrv.in')) { rv.forEach(function (el) { el.classList.add('in'); }); }
      }, 2000);
    });
  }

  function count(el) {
    var to = parseFloat(el.dataset.to), suf = el.dataset.suf || '';
    if (reduce) { el.textContent = to + suf; return; }
    var t0 = performance.now(), dur = 1100;
    (function step(now) {
      var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var nums = document.querySelectorAll('.n[data-to]');
  if (reduce || !('IntersectionObserver' in window)) { nums.forEach(count); }
  else {
    var nio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { count(e.target); nio.unobserve(e.target); } });
    }, { threshold: .6 });
    nums.forEach(function (el) { nio.observe(el); });
  }

  /* ======================================================================
     Industries marquee — duplicated so the loop is seamless
     ====================================================================== */
  var INDS = ['Insurance', 'Reinsurance', 'Government', 'Infrastructure', 'Energy & utilities',
              'Real estate', 'Engineering & EPC', 'Banking', 'Disaster management',
              'Urban planning', 'Mining', 'Agriculture', 'Telecom', 'Education'];
  function fill(el, list) {
    if (!el) return;
    var half = list.map(function (i) { return '<span class="chipi">' + i + '</span>'; }).join('');
    el.innerHTML = half + half;
  }
  fill(document.getElementById('t1'), INDS);
  fill(document.getElementById('t2'), INDS.slice().reverse());

  /* ======================================================================
     Scroll-scrubbed through-line + self-drawing engage rail
     ====================================================================== */
  var strands = document.querySelectorAll('[data-s]');
  var trunk   = document.querySelector('[data-t]');
  var dot     = document.getElementById('threadDot');
  var outTxt  = document.getElementById('threadOut');
  var stage   = document.getElementById('threadSvg');
  var rail    = document.getElementById('rail');
  var railFill = document.getElementById('railFill');

  function prep(p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return L; }
  var sLens = [].map.call(strands, prep);
  var tLen = trunk ? prep(trunk) : 0;
  var rLen = railFill ? prep(railFill) : 0;

  function drawThread() {
    if (!stage) return;
    var r = stage.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.85 - r.top) / (r.height + vh * 0.30);
    p = Math.max(0, Math.min(1, p));
    var sp = Math.min(1, p / 0.7), tp = Math.max(0, (p - 0.6) / 0.4);
    [].forEach.call(strands, function (el, i) { el.style.strokeDashoffset = sLens[i] * (1 - sp); });
    if (trunk) trunk.style.strokeDashoffset = tLen * (1 - tp);
    if (dot) dot.setAttribute('opacity', sp > .96 ? '1' : '0');
    if (outTxt) outTxt.setAttribute('opacity', tp > .8 ? '1' : '0');
  }
  function drawRail() {
    if (!rail || !railFill) return;
    var r = rail.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.8 - r.top) / (vh * 0.45);
    railFill.style.strokeDashoffset = rLen * (1 - Math.max(0, Math.min(1, p)));
  }

  if (reduce) {
    [].forEach.call(strands, function (el) { el.style.strokeDashoffset = 0; });
    if (trunk) trunk.style.strokeDashoffset = 0;
    if (dot) dot.setAttribute('opacity', '1');
    if (outTxt) outTxt.setAttribute('opacity', '1');
    if (railFill) railFill.style.strokeDashoffset = 0;
  } else {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { drawThread(); drawRail(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ======================================================================
     Contact — the four division colours drifting behind the form
     ====================================================================== */
  var cv = document.getElementById('ctaCanvas');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1, raf = null, on = false;
    var COLS = ['0,194,168', '99,102,241', '255,122,0', '34,197,94'];
    function size() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(cv);
    var ct0 = performance.now();
    function cframe(now) {
      var t = (now - ct0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < 4; i++) {
        var cx = (0.18 + 0.22 * i + Math.sin(t * 0.22 + i) * 0.05) * W;
        var cy = (0.5 + Math.cos(t * 0.18 + i * 1.4) * 0.24) * H;
        var rad = Math.min(W, H) * (0.42 + 0.08 * Math.sin(t * 0.3 + i));
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, 'rgba(' + COLS[i] + ',0.16)');
        g.addColorStop(1, 'rgba(' + COLS[i] + ',0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      raf = requestAnimationFrame(cframe);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        on = en[0].isIntersecting;
        if (on && !raf) { raf = requestAnimationFrame(cframe); }
        else if (!on && raf) { cancelAnimationFrame(raf); raf = null; }
      }, { threshold: 0 }).observe(cv);
    } else { raf = requestAnimationFrame(cframe); }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && on && !raf) { raf = requestAnimationFrame(cframe); }
    });
  }
})();
