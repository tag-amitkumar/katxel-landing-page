/* ==========================================================================
   Katxel — shared site behaviour (nav, reveal, counters, contact form)
   Loaded with `defer` on every page. Page-specific widgets live in the page.
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- divisions dropdown ---------- */
  document.querySelectorAll('.dd').forEach(function (dd) {
    var btn = dd.querySelector('button');
    if (!btn) return;
    var close = function () { dd.dataset.open = 'false'; btn.setAttribute('aria-expanded', 'false'); };
    var open = function () { dd.dataset.open = 'true'; btn.setAttribute('aria-expanded', 'true'); };

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dd.dataset.open === 'true' ? close() : open();
    });
    // hover only on pointer-fine screens; touch uses click
    if (window.matchMedia('(hover:hover) and (min-width:981px)').matches) {
      dd.addEventListener('mouseenter', open);
      dd.addEventListener('mouseleave', close);
    }
    dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) close(); });
  });

  /* ---------- scroll reveal ---------- */
  var revealTargets = document.querySelectorAll('.reveal, .stagger');
  if (reduce || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .14 });
    revealTargets.forEach(function (el) { io.observe(el); });

    // Failsafe: reveal-on-scroll must never be the reason content stays
    // invisible. If the observer hasn't fired at all shortly after load,
    // drop the effect and show everything.
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (!document.querySelector('.reveal.in, .stagger.in')) {
          revealTargets.forEach(function (el) { el.classList.add('in'); });
        }
      }, 2000);
    });
  }

  /* ---------- animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var decimals = (el.dataset.count.split('.')[1] || '').length;
    if (reduce) { el.innerHTML = target.toFixed(decimals) + '<span class="suf">' + suffix + '</span>'; return; }
    var dur = 1500, start = performance.now();
    (function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = (target * eased).toFixed(decimals) + '<span class="suf">' + suffix + '</span>';
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  var nums = document.querySelectorAll('.num[data-count]');
  if (reduce || !('IntersectionObserver' in window)) {
    nums.forEach(animateCount);
  } else {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); statIO.unobserve(e.target); }
      });
    }, { threshold: .6 });
    nums.forEach(function (el) { statIO.observe(el); });
  }

  /* ---------- contact form ----------
     Works with no backend: falls back to opening the visitor's mail client with
     everything pre-filled. Set data-endpoint on the <form> (e.g. a Formspree URL)
     and it POSTs instead — see README.
  ------------------------------------- */
  document.querySelectorAll('form.form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var btnHTML = btn ? btn.innerHTML : '';

    function say(msg, state) {
      if (!status) return;
      status.textContent = msg;
      status.dataset.state = state || '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // native constraint validation first
      if (!form.checkValidity()) {
        form.querySelectorAll(':invalid').forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
        var first = form.querySelector(':invalid');
        if (first) first.focus();
        say('Please complete the highlighted fields.', 'error');
        return;
      }
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });

      var data = Object.fromEntries(new FormData(form).entries());
      var endpoint = form.dataset.endpoint;

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      say('', '');

      var done = function (ok, msg) {
        if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
        say(msg, ok ? 'ok' : 'error');
        if (ok) form.reset();
      };

      if (endpoint) {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            done(true, 'Thanks — we’ll be in touch within one business day.');
          })
          .catch(function () {
            done(false, 'Something went wrong. Please email info.katxel@gmail.com directly.');
          });
        return;
      }

      // No endpoint configured — hand off to the visitor's mail client.
      var to = form.dataset.mailto || 'info.katxel@gmail.com';
      var subject = '[' + (data.division || 'Katxel') + '] Enquiry from ' + (data.name || 'website');
      var lines = [
        'Name: ' + (data.name || ''),
        'Company: ' + (data.company || ''),
        'Email: ' + (data.email || ''),
        'Country: ' + (data.country || ''),
        'Division: ' + (data.division || ''),
        'Service interest: ' + (data.service || ''),
        '',
        (data.message || '')
      ].join('\n');
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines);
      done(true, 'Opening your email client — press send and we’ll take it from there.');
    });
  });

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
