/* ==========================================================================
   Katxel Learn — internship application form (learn.html #apply-internship)

   POSTs the application as JSON to data-endpoint (the training.katxel.in
   Pages Function, which stores it for the offer-letter generator). If the
   endpoint can't be reached it falls back to opening the visitor's mail
   client with every field pre-filled, so no application is ever lost.
   ========================================================================== */
(function () {
  'use strict';
  var form = document.getElementById('internForm');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');
  var btnHTML = btn ? btn.innerHTML : '';
  var title = form.querySelector('[name="title"]');
  var relation = form.querySelector('[name="relation"]');
  var start = form.querySelector('[name="startDate"]');

  var DOMAINS = { gis: 'GIS', developer: 'CS & IT - Developer', tester: 'CS & IT - Tester', marketing: 'Marketing' };

  // Ms. -> D/o, Mr. -> S/o (still editable afterwards)
  title.addEventListener('change', function () { relation.value = title.value === 'Ms.' ? 'D/o' : 'S/o'; });

  // earliest start date: today
  start.min = new Date().toISOString().slice(0, 10);

  function say(msg, state) { status.textContent = msg; status.dataset.state = state || ''; }

  function clean(data) {
    Object.keys(data).forEach(function (k) { if (typeof data[k] === 'string') data[k] = data[k].replace(/\s+/g, ' ').trim(); });
    data.mobile = (data.mobile || '').replace(/\D/g, '').slice(-10);
    return data;
  }

  function mailtoFallback(data) {
    var to = form.dataset.mailto || 'info.katxel@gmail.com';
    var subject = '[Katxel Learn] Internship application - ' + (DOMAINS[data.domain] || data.domain) + ' - ' + data.name;
    var lines = [
      'Internship domain: ' + (DOMAINS[data.domain] || data.domain),
      'Preferred start: ' + data.startDate + '  |  Duration: ' + data.duration + ' month(s)  |  Mode: ' + data.workMode,
      '',
      'Name: ' + data.title + ' ' + data.name,
      data.relation + ': ' + data.father,
      'Email: ' + data.email,
      'Mobile: ' + data.mobile,
      'Address: ' + data.address + ', ' + data.city + ', ' + data.state + ' - ' + data.pin,
      '',
      'College: ' + data.college,
      'Course: ' + data.course + ' (' + data.year + ')',
      'Skills: ' + (data.skills || ''),
      'Link: ' + (data.link || ''),
      '',
      data.message || ''
    ].join('\n');
    window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
    if (!form.checkValidity()) {
      form.querySelectorAll(':invalid').forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
      var first = form.querySelector(':invalid');
      if (first) first.focus();
      say('Please complete the highlighted fields.', 'error');
      return;
    }

    var data = clean(Object.fromEntries(new FormData(form).entries()));
    if (data.website) { say('Thanks — your application has been received.', 'ok'); form.reset(); return; } // honeypot

    btn.disabled = true; btn.textContent = 'Submitting…'; say('', '');
    var finish = function (ok, msg) { btn.disabled = false; btn.innerHTML = btnHTML; say(msg, ok ? 'ok' : 'error'); if (ok) form.reset(); };

    var endpoint = form.dataset.endpoint;
    if (!endpoint) { mailtoFallback(data); finish(true, 'Opening your email client — press send to submit your application.'); return; }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.ok) return finish(true, 'Application received (ID ' + (res.body.id || '—') + '). We will email you within three business days.');
        if (res.status === 400 && res.body.error) return finish(false, res.body.error);
        throw new Error('HTTP ' + res.status);
      })
      .catch(function () {
        mailtoFallback(data);
        finish(true, 'Our form service is unreachable, so we opened your email client with your application filled in — press send.');
      });
  });
})();
