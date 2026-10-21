// POST /api/contact — the enquiry form at the bottom of every page.
// Same format as internship applications (api/apply.js): the Katxel mailbox
// gets every field with a reference ID and a one-row CSV attachment for the
// enquiries register (Reply-To = the sender), and the sender gets an
// acknowledgement with a copy of their message.
const m = require('./_lib/mail');

function rows(q) {
  return [
    ['Enquiry ID', q.id],
    ['Submitted', m.istTime(q.submittedAt)],
    ['Division', q.division],
    ['Interested in', q.service],
    ['Name', q.name],
    ['Email', q.email],
    ['College / company', q.company],
    ['City / country', q.country],
    ['Message', q.message],
    ['Sent from', q.page]
  ];
}

function teamMail(q) {
  const r = rows(q);
  return {
    from: m.from('Katxel Website'),
    to: m.teamAddresses(),
    replyTo: { name: q.name, address: q.email },
    subject: `Enquiry: ${q.name} - ${q.division}${q.service ? ' - ' + q.service : ''} (${q.id})`,
    html: m.page([`<b>${m.esc(q.name)}</b> sent an enquiry via the <b>${m.esc(q.division)}</b> page.`], r,
      ['Press <b>Reply</b> to answer them directly. The attached CSV row can be pasted into your enquiries register.']),
    text: `${q.name} sent an enquiry via the ${q.division} page.\n\n${m.textTable(r)}\n\nReply to this email to answer them directly.\n`,
    attachments: [{ filename: `${q.id}.csv`, content: m.csv(r), contentType: 'text/csv; charset=utf-8' }]
  };
}

function senderMail(q) {
  const r = rows(q).filter(([k]) => !['Submitted', 'Sent from'].includes(k));
  const first = q.name.split(' ')[0];
  return {
    from: m.from(q.division),
    to: { name: q.name, address: q.email },
    replyTo: m.teamAddresses()[0],
    subject: `We've received your enquiry (${q.id})`,
    html: m.page([`Dear ${m.esc(first)},`, `Thank you for contacting ${m.esc(q.division)}. We have received your message and will reply within one business day. A copy of what you sent is below.`],
      r, ['Warm regards,<br>Team Katxel']),
    text: `Dear ${first},\n\nThank you for contacting ${q.division}. We have received your message and will reply within one business day. A copy of what you sent is below.\n\n` +
      m.textTable(r) + '\n\nWarm regards,\nTeam Katxel\n'
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return m.reply(res, 405, { error: 'Method not allowed' }); }
  const body = m.readBody(req);
  if (!body) return m.reply(res, 400, { error: 'Invalid request.' });
  if (m.tooFast(body)) return m.reply(res, 200, { ok: true }); // bot: pretend success
  if (m.throttled(m.clientIp(req), 8)) return m.reply(res, 429, { error: 'Too many messages from your network. Please try again later.' });

  const q = {
    name: m.clean(body.name, 80),
    company: m.clean(body.company, 120),
    email: m.clean(body.email, 120),
    country: m.clean(body.country, 60),
    division: m.clean(body.division, 40) || 'Katxel',
    service: m.clean(body.service, 120),
    message: m.cleanText(body.message, 4000),
    page: m.clean(body.page, 200)
  };
  if (!q.name || !q.email || !q.message) return m.reply(res, 400, { error: 'Please fill in your name, email and message.' });
  if (!m.EMAIL_RE.test(q.email)) return m.reply(res, 400, { error: 'Please enter a valid email address.' });

  const now = new Date();
  q.id = m.refId('KQ', now);
  q.submittedAt = now.toISOString();

  const [team, sender] = await Promise.all([m.send(teamMail(q)), m.send(senderMail(q))]);
  console.log('enquiry', q.id, { team, sender });

  if (!m.ok(team)) return m.reply(res, 503, { error: 'Could not deliver the message.' });
  return m.reply(res, 200, { ok: true, id: q.id, emailed: m.ok(sender) });
};
