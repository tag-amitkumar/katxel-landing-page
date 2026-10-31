// Shared helpers for the email functions in api/ (the leading underscore
// keeps Vercel from deploying this file as a function of its own).
//
// Mail goes out through the Katxel mailbox on Hostinger over SMTP, so it is
// sent *from* that mailbox and lands in it. Vercel environment variables:
//
//   SMTP_USER     the full Hostinger mailbox address (e.g. info@katxel.in)  — required
//   SMTP_PASS     that mailbox's password                                      — required
//   NOTIFY_EMAIL  who receives new enquiries/applications (comma-separated)   — default SMTP_USER
//   SMTP_HOST / SMTP_PORT / SMTP_SECURE   default smtp.hostinger.com / 465 / true
//   MAIL_FROM_NAME  display name on outgoing mail                            — default "Katxel"
const crypto = require('crypto');
const nodemailer = require('nodemailer');

let transporter = null;
function transport() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE || 'true') !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

function mailbox() { return process.env.SMTP_USER; }
function teamAddresses() {
  return (process.env.NOTIFY_EMAIL || process.env.SMTP_USER || '').split(',').map((s) => s.trim()).filter(Boolean);
}
function from(name) {
  return { name: name || process.env.MAIL_FROM_NAME || 'Katxel', address: mailbox() };
}

// Sends one message; never throws. Returns the SMTP message id or "error: …".
async function send(message) {
  const t = transport();
  if (!t) return 'error: SMTP_USER / SMTP_PASS not set';
  try {
    const info = await t.sendMail(message);
    return info.messageId || 'sent';
  } catch (e) {
    console.error('SMTP send failed:', e && e.message);
    return 'error: ' + (e && e.message ? e.message : String(e));
  }
}
const ok = (r) => r && !String(r).startsWith('error:');

/* ------------------------------------------------------------- request utils */
function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return null; }
}
function clientIp(req) {
  const h = req.headers;
  return h['cf-connecting-ip'] || h['x-real-ip'] || String(h['x-forwarded-for'] || '').split(',')[0].trim();
}
function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
function clean(v, max) { return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max); }
function cleanText(v, max) { return String(v ?? '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, max); }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Light, per-instance throttle (a warm function instance remembers recent IPs).
const hits = new Map();
function throttled(ip, max = 5, windowMs = 3600e3) {
  if (!ip) return false;
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}
// Submitted faster than a person could fill the form in.
function tooFast(body, minMs = 3000) {
  const e = Number(body.elapsed);
  return e > 0 && e < minMs;
}

/* ------------------------------------------------- reference ids and dates */
// e.g. KL-261021-905623 (applications) / KQ-261021-1A2B3C (enquiries)
function refId(prefix, now = new Date()) {
  return prefix + '-' + now.toISOString().slice(2, 10).replace(/-/g, '') + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}
function istTime(d) {
  return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
}

/* ---------------------------------------------------------------- templates */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function table(rows) {
  return '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0 18px;width:100%;max-width:580px;font:14px/1.45 Arial,Helvetica,sans-serif;color:#0B1F3A">' +
    rows.filter(([, v]) => v).map(([k, v]) =>
      `<tr><td style="padding:7px 14px 7px 0;border-bottom:1px solid #E4E9F0;color:#5B6B82;white-space:nowrap;vertical-align:top">${esc(k)}</td>` +
      `<td style="padding:7px 0;border-bottom:1px solid #E4E9F0;vertical-align:top;white-space:pre-wrap">${esc(v)}</td></tr>`).join('') +
    '</table>';
}
function textTable(rows) {
  return rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
}
function page(paragraphsBefore, rows, paragraphsAfter) {
  const p = (t) => `<p style="margin:0 0 14px">${t}</p>`;
  return `<div style="font:15px/1.55 Arial,Helvetica,sans-serif;color:#0B1F3A;max-width:620px">` +
    paragraphsBefore.map(p).join('') + (rows ? table(rows) : '') + paragraphsAfter.map(p).join('') +
    '<p style="margin:24px 0 0;color:#8A99AD;font-size:12.5px">Katxel Private Limited · <a href="https://www.katxel.in" style="color:#8A99AD">katxel.in</a></p></div>';
}
// One-row CSV (header + values) so a register can be kept in Excel / Sheets.
function csv(rows) {
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  return rows.map(([k]) => q(k)).join(',') + '\r\n' + rows.map(([, v]) => q(v)).join(',') + '\r\n';
}

module.exports = {
  send, ok, mailbox, teamAddresses, from, transport,
  readBody, clientIp, reply, clean, cleanText, EMAIL_RE, throttled, tooFast,
  esc, page, textTable, csv, refId, istTime
};
