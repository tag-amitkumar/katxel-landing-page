// POST /api/contact — the "Talk to us" / enquiry form on every page.
// Emails the enquiry to the Katxel mailbox (reply-to = the sender) and sends
// the sender an acknowledgement with a copy of their message.
const m = require('./_lib/mail');

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

  const rows = [
    ['Division', q.division],
    ['Name', q.name],
    ['Email', q.email],
    ['College / company', q.company],
    ['City / country', q.country],
    ['Interested in', q.service],
    ['Message', q.message],
    ['Sent from', q.page],
    ['Received', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST']
  ];
  const first = q.name.split(' ')[0];

  const [team, sender] = await Promise.all([
    m.send({
      from: m.from('Katxel Website'),
      to: m.teamAddresses(),
      replyTo: { name: q.name, address: q.email },
      subject: `[${q.division}] Enquiry from ${q.name}${q.service ? ' - ' + q.service : ''}`,
      html: m.page([`New enquiry from <b>${m.esc(q.name)}</b> via the ${m.esc(q.division)} page.`], rows, ['Press <b>Reply</b> to answer them directly.']),
      text: `New enquiry from ${q.name} via the ${q.division} page.\n\n${m.textTable(rows)}\n\nReply to this email to answer them directly.\n`
    }),
    m.send({
      from: m.from(q.division),
      to: { name: q.name, address: q.email },
      replyTo: m.teamAddresses()[0],
      subject: `Thanks for contacting ${q.division}`,
      html: m.page([`Dear ${m.esc(first)},`, 'Thank you for getting in touch. We have received your message and will reply within one business day. A copy of what you sent is below.'],
        rows.filter(([k]) => !['Sent from', 'Received', 'Division'].includes(k)), ['Warm regards,<br>Team Katxel']),
      text: `Dear ${first},\n\nThank you for getting in touch. We have received your message and will reply within one business day. A copy of what you sent is below.\n\n` +
        m.textTable(rows.filter(([k]) => !['Sent from', 'Received', 'Division'].includes(k))) + '\n\nWarm regards,\nTeam Katxel\n'
    })
  ]);
  console.log('enquiry', q.email, { team, sender });

  if (!m.ok(team)) return m.reply(res, 503, { error: 'Could not deliver the message.' });
  return m.reply(res, 200, { ok: true });
};
